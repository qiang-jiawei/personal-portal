import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

// Register new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "register") {
      return handleRegister(body);
    } else if (action === "login") {
      return handleLogin(body);
    } else if (action === "check") {
      return handleCheck(request);
    } else if (action === "logout") {
      return handleLogout(request);
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

async function handleRegister(body: { phone?: string; password?: string; name?: string }) {
  const { phone, password, name } = body;

  if (!phone || !password) {
    return NextResponse.json({ success: false, error: "手机号和密码不能为空" }, { status: 400 });
  }

  if (!/^1\d{10}$/.test(phone)) {
    return NextResponse.json({ success: false, error: "手机号格式不正确" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ success: false, error: "密码长度不能少于6位" }, { status: 400 });
  }

  const client = getSupabaseClient();

  // Check if phone already exists
  const { data: existing, error: checkError } = await client
    .from("users")
    .select("id")
    .eq("phone", phone)
    .is("deleted_at" as string, null as unknown as string)
    .maybeSingle();

  if (checkError && checkError.code !== "PGRST116") {
    // If the error is about column not existing, just check phone
    const { data: existingUser, error: phoneError } = await client
      .from("users")
      .select("id, is_active")
      .eq("phone", phone)
      .maybeSingle();

    if (phoneError) throw new Error(`查询用户失败: ${phoneError.message}`);
    if (existingUser) {
      return NextResponse.json({ success: false, error: "该手机号已注册" }, { status: 409 });
    }
  } else if (existing) {
    return NextResponse.json({ success: false, error: "该手机号已注册" }, { status: 409 });
  }

  // Simple hash (in production, use bcrypt)
  const passwordHash = Buffer.from(password).toString("base64");
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from("users")
    .insert({
      id: crypto.randomUUID(),
      phone,
      password_hash: passwordHash,
      name: name || phone,
      login_token: token,
      token_expires_at: expiresAt,
      last_login_at: new Date().toISOString(),
    })
    .select("id, phone, name")
    .single();

  if (error) throw new Error(`注册失败: ${error.message}`);

  const response = NextResponse.json({ success: true, user: data });
  response.cookies.set("user_token", token, {
    httpOnly: true,
    secure: process.env.COZE_PROJECT_ENV === "PROD",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return response;
}

async function handleLogin(body: { phone?: string; password?: string }) {
  const { phone, password } = body;

  if (!phone || !password) {
    return NextResponse.json({ success: false, error: "手机号和密码不能为空" }, { status: 400 });
  }

  const client = getSupabaseClient();
  const passwordHash = Buffer.from(password).toString("base64");

  const { data: user, error } = await client
    .from("users")
    .select("id, phone, name, password_hash, is_active, is_frozen")
    .eq("phone", phone)
    .maybeSingle();

  if (error) throw new Error(`查询用户失败: ${error.message}`);
  if (!user) {
    return NextResponse.json({ success: false, error: "手机号或密码错误" }, { status: 401 });
  }

  if (user.is_frozen) {
    return NextResponse.json({ success: false, error: "账号已被冻结" }, { status: 403 });
  }

  if (!user.is_active) {
    return NextResponse.json({ success: false, error: "账号已注销" }, { status: 403 });
  }

  if (user.password_hash !== passwordHash) {
    return NextResponse.json({ success: false, error: "手机号或密码错误" }, { status: 401 });
  }

  // Generate new token with 7-day expiry
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await client
    .from("users")
    .update({ login_token: token, token_expires_at: expiresAt, last_login_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) throw new Error(`更新登录状态失败: ${updateError.message}`);

  const response = NextResponse.json({
    success: true,
    user: { id: user.id, phone: user.phone, name: user.name },
  });

  response.cookies.set("user_token", token, {
    httpOnly: true,
    secure: process.env.COZE_PROJECT_ENV === "PROD",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return response;
}

async function handleCheck(request: NextRequest) {
  const token = request.cookies.get("user_token")?.value;

  if (!token) {
    return NextResponse.json({ success: false, logged_in: false });
  }

  const client = getSupabaseClient();
  const { data: user, error } = await client
    .from("users")
    .select("id, phone, name, token_expires_at, is_active, is_frozen")
    .eq("login_token", token)
    .maybeSingle();

  if (error) throw new Error(`验证登录状态失败: ${error.message}`);

  if (!user) {
    const response = NextResponse.json({ success: false, logged_in: false });
    response.cookies.delete("user_token");
    return response;
  }

  // Check token expiry
  if (user.token_expires_at && new Date(user.token_expires_at) < new Date()) {
    const response = NextResponse.json({ success: false, logged_in: false });
    response.cookies.delete("user_token");
    return response;
  }

  if (user.is_frozen || !user.is_active) {
    const response = NextResponse.json({ success: false, logged_in: false });
    response.cookies.delete("user_token");
    return response;
  }

  return NextResponse.json({
    success: true,
    logged_in: true,
    user: { id: user.id, phone: user.phone, name: user.name },
  });
}

async function handleLogout(request: NextRequest) {
  const token = request.cookies.get("user_token")?.value;

  if (token) {
    const client = getSupabaseClient();
    await client.from("users").update({ login_token: null, token_expires_at: null }).eq("login_token", token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("user_token");
  return response;
}

// GET - check login status
export async function GET(request: NextRequest) {
  return handleCheck(request);
}

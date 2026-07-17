import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

// Admin login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, password } = body;

    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (action === "login") {
      if (username === adminUsername && password === adminPassword) {
        const response = NextResponse.json({
          success: true,
          user: { role: "admin", username },
        });
        // Session-only cookie (no maxAge = expires when browser closes)
        response.cookies.set("admin_session", btoa(`${username}:${Date.now()}`), {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
        });
        return response;
      }
      return NextResponse.json({ success: false, error: "管理员账号或密码错误" }, { status: 401 });
    }

    if (action === "check") {
      return handleAdminCheck(request);
    }

    if (action === "logout") {
      const response = NextResponse.json({ success: true });
      response.cookies.delete("admin_session");
      return response;
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

async function handleAdminCheck(request: NextRequest) {
  const session = request.cookies.get("admin_session")?.value;

  if (!session) {
    return NextResponse.json({ success: false, is_admin: false });
  }

  return NextResponse.json({
    success: true,
    is_admin: true,
    user: { role: "admin" },
  });
}

export async function GET(request: NextRequest) {
  const body = { action: "check" };
  // Reuse POST logic for GET check
  const mockRequest = new Request("http://localhost/api/admin-auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // Copy cookies
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    mockRequest.headers.set("cookie", cookieHeader);
  }
  // For simplicity, just check the cookie directly
  return handleAdminCheck(request);
}

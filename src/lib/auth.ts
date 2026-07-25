import { NextRequest } from "next/server";
import { getSupabaseServiceClient } from "@/storage/database/supabase-client";

/**
 * 从请求中获取用户信息（通过 user_token cookie）
 */
export async function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get("user_token")?.value;
  if (!token) return null;

  const client = getSupabaseServiceClient();
  const { data: user } = await client
    .from("users")
    .select("id, phone, name, token_expires_at")
    .eq("login_token", token)
    .maybeSingle();

  if (!user) return null;
  if (user.token_expires_at && new Date(user.token_expires_at) < new Date()) return null;
  return user;
}

/**
 * 检查是否为管理员（通过 admin_session cookie）
 */
export async function checkAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get("admin_session")?.value;
  if (!session) return false;
  try {
    const decoded = atob(session);
    const parts = decoded.split(":");
    if (parts.length !== 2) return false;
    const [username] = parts;
    const adminUser = process.env.ADMIN_USERNAME || "admin";
    return username === adminUser;
  } catch {
    return false;
  }
}

/**
 * 要求用户已登录，否则返回 401 响应
 */
export async function requireAuth(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return { user: null, error: new Response(
      JSON.stringify({ success: false, error: "未登录" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    )};
  }
  return { user, error: null };
}

/**
 * 要求管理员权限，否则返回 401 响应
 */
export async function requireAdmin(request: NextRequest) {
  const isAdmin = await checkAdmin(request);
  if (!isAdmin) {
    return { isAdmin: false, error: new Response(
      JSON.stringify({ success: false, error: "未授权" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    )};
  }
  return { isAdmin: true, error: null };
}

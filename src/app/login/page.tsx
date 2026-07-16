"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Mode = "login" | "register" | "admin";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  useEffect(() => {
    // Check if already logged in
    fetch("/api/auth").then((r) => r.json()).then((d) => {
      if (d.success && d.logged_in) router.push("/service");
    }).catch(() => {});
  }, [router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (mode === "register" && !confirmModal) {
        if (password !== confirmPassword) {
          setError("两次输入的密码不一致");
          return;
        }
        setConfirmModal(true);
        return;
      }

      setLoading(true);
      try {
        let url = "/api/auth";
        let body: Record<string, string> = {};

        if (mode === "admin") {
          url = "/api/admin-auth";
          body = { action: "login", username: adminUser, password: adminPass };
        } else if (mode === "login") {
          body = { action: "login", phone, password };
        } else {
          body = { action: "register", phone, password, name };
        }

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (data.success) {
          if (mode === "admin") {
            router.push("/admin");
          } else {
            router.push("/service");
          }
        } else {
          setError(data.error || "操作失败");
          setConfirmModal(false);
        }
      } catch {
        setError("网络错误，请稍后重试");
        setConfirmModal(false);
      } finally {
        setLoading(false);
      }
    },
    [mode, phone, password, confirmPassword, name, adminUser, adminPass, router, confirmModal]
  );

  const doRegister = useCallback(async () => {
    setConfirmModal(false);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", phone, password, name }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/service");
      } else {
        setError(data.error || "注册失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, [phone, password, name, router]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md mx-auto">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-8 h-[2px] bg-[#b8860b]" />
            <span className="text-xs text-[#6b7280] tracking-widest uppercase">Account</span>
            <div className="w-8 h-[2px] bg-[#b8860b]" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
            {mode === "login" ? "用户登录" : mode === "register" ? "用户注册" : "管理员登录"}
          </h1>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-[#e5e5e5] dark:border-[#2a2a3a] mb-8">
          {[
            { key: "login" as Mode, label: "登录" },
            { key: "register" as Mode, label: "注册" },
            { key: "admin" as Mode, label: "管理员" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setMode(tab.key); setError(""); setConfirmModal(false); }}
              className={cn(
                "flex-1 py-2.5 text-sm transition-colors duration-200 relative",
                mode === tab.key
                  ? "text-[#1a1a2e] dark:text-[#fafaf9] font-medium"
                  : "text-[#6b7280] hover:text-[#1a1a2e] dark:hover:text-[#fafaf9]"
              )}
            >
              {tab.label}
              {mode === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#b8860b]" />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "admin" ? (
            <>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1.5">管理员用户名</label>
                <input
                  type="text"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1.5">密码</label>
                <input
                  type="password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors"
                  required
                />
              </div>
              <p className="text-[10px] text-[#6b7280]">管理员登录为会话级，关闭浏览器后失效</p>
            </>
          ) : (
            <>
              {mode === "register" && (
                <div>
                  <label className="block text-xs text-[#6b7280] mb-1.5">姓名</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors"
                    placeholder="选填"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-[#6b7280] mb-1.5">手机号</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors"
                  placeholder="请输入11位手机号"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1.5">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors"
                  placeholder="至少6位"
                  required
                  minLength={6}
                />
              </div>
              {mode === "register" && (
                <div>
                  <label className="block text-xs text-[#6b7280] mb-1.5">确认密码</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors"
                    placeholder="再次输入密码"
                    required
                    minLength={6}
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <div className="text-xs text-red-600 dark:text-red-400">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm bg-[#1a1a2e] text-white dark:bg-[#fafaf9] dark:text-[#1a1a2e] hover:bg-[#b8860b] dark:hover:bg-[#b8860b] dark:hover:text-white transition-colors duration-200 rounded-[2px] disabled:opacity-50"
          >
            {loading ? "处理中..." : mode === "login" ? "登录" : mode === "register" ? "注册" : "管理员登录"}
          </button>
        </form>

        {mode === "login" && (
          <div className="mt-6 text-center">
            <Link href="/forgot-password" className="text-xs text-[#6b7280] hover:text-[#b8860b] transition-colors">
              忘记密码？
            </Link>
          </div>
        )}
      </div>

      {/* Confirmation modal for registration */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmModal(false)} />
          <div className="relative bg-white dark:bg-[#1a1a2e] w-full max-w-sm p-6 rounded-[2px]">
            <h3 className="font-serif text-lg font-semibold text-[#1a1a2e] dark:text-[#fafaf9] mb-3">
              确认注册
            </h3>
            <p className="text-sm text-[#6b7280] mb-6">
              请确认以下信息：
              <br />
              手机号：{phone}
              <br />
              注册后手机号将作为唯一标识，请确保手机号正确。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(false)}
                className="flex-1 py-2 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] text-[#6b7280] hover:bg-[#f5f5f4] dark:hover:bg-[#1e1e32] transition-colors rounded-[2px]"
              >
                返回修改
              </button>
              <button
                onClick={doRegister}
                className="flex-1 py-2 text-sm bg-[#1a1a2e] text-white dark:bg-[#fafaf9] dark:text-[#1a1a2e] hover:bg-[#b8860b] transition-colors rounded-[2px]"
              >
                确认注册
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

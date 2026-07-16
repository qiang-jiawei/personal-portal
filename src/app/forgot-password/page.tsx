"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^1\d{10}$/.test(phone)) {
      setError("手机号格式不正确");
      return;
    }
    if (newPassword.length < 6) {
      setError("新密码至少6位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次密码不一致");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, new_password: newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "重置失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto text-center py-20">
          <h2 className="font-serif text-xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9] mb-2">
            密码重置成功
          </h2>
          <p className="text-sm text-[#6b7280] mb-6">请使用新密码登录</p>
          <a href="/login" className="text-sm text-[#b8860b] hover:underline">前往登录</a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md mx-auto">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-2xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
            忘记密码
          </h1>
          <p className="text-sm text-[#6b7280] mt-2">通过手机号重置密码</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#6b7280] mb-1.5">注册手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#6b7280] mb-1.5">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-xs text-[#6b7280] mb-1.5">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors"
              required
              minLength={6}
            />
          </div>
          {error && <div className="text-xs text-red-600 dark:text-red-400">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm bg-[#1a1a2e] text-white dark:bg-[#fafaf9] dark:text-[#1a1a2e] hover:bg-[#b8860b] transition-colors rounded-[2px] disabled:opacity-50"
          >
            {loading ? "处理中..." : "重置密码"}
          </button>
        </form>
      </div>
    </div>
  );
}

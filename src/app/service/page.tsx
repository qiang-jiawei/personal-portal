"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface UserInfo {
  id: string;
  phone: string;
  name: string;
}

export default function ServicePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.logged_in) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-[#6b7280]">加载中...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-[2px] bg-[#b8860b]" />
            <span className="text-xs text-[#6b7280] tracking-widest uppercase">Service</span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
            服务大厅
          </h1>
        </div>

        {/* Login required notice */}
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#e5e5e5] dark:border-[#2a2a3a] rounded-[2px]">
          <svg className="h-12 w-12 text-[#6b7280] opacity-40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-sm text-[#6b7280] mb-6">请先登录后使用服务大厅功能</p>
          <Link
            href="/login"
            className="px-6 py-2.5 text-sm bg-[#1a1a2e] text-white dark:bg-[#fafaf9] dark:text-[#1a1a2e] hover:bg-[#b8860b] dark:hover:bg-[#b8860b] dark:hover:text-white transition-colors duration-200 rounded-[2px]"
          >
            登录 / 注册
          </Link>
        </div>
      </div>
    );
  }

  const services = [
    {
      title: "在线咨询",
      desc: "提交咨询问题，查看回复",
      href: "/service/consultation",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      title: "信息申请公开",
      desc: "申请信息公开，跟踪处理进度",
      href: "/service/disclosure-request",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: "财务管理",
      desc: "借据查询、核验与管理",
      href: "/service/finance",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-[2px] bg-[#b8860b]" />
          <span className="text-xs text-[#6b7280] tracking-widest uppercase">Service</span>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
          服务大厅
        </h1>
        <p className="text-sm text-[#6b7280] mt-2">
          欢迎，{user.name}（{user.phone}）
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Link
            key={service.href}
            href={service.href}
            className="group p-6 border border-[#e5e5e5] dark:border-[#2a2a3a] rounded-[2px] hover:border-[#b8860b] dark:hover:border-[#b8860b] transition-colors duration-200"
          >
            <div className="text-[#6b7280] group-hover:text-[#b8860b] transition-colors duration-200 mb-4">
              {service.icon}
            </div>
            <h3 className="text-sm font-medium text-[#1a1a2e] dark:text-[#fafaf9] mb-1">
              {service.title}
            </h3>
            <p className="text-xs text-[#6b7280]">{service.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

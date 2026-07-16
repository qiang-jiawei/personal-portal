"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface VisitStats {
  total_count: number;
  today_count: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<VisitStats | null>(null);

  useEffect(() => {
    // Record visit and fetch stats
    fetch("/api/visit", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats({ total_count: data.total_count, today_count: data.today_count });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative">
      {/* Hero Section - Full screen */}
      <section className="relative h-screen min-h-[500px] flex items-center justify-center overflow-hidden -mt-[7.5rem]">
        {/* Background image */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1920&q=80')`,
            }}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-[#1a1a2e]/60 dark:bg-[#0f0f1a]/70" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="inline-block w-16 h-[2px] bg-[#b8860b] mb-6" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6 tracking-wide">
            欢迎来到个人门户
          </h1>
          <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10">
            集信息公开、在线咨询、财务管理于一体的综合服务平台
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/profile"
              className="px-6 py-2.5 text-sm bg-white text-[#1a1a2e] hover:bg-[#b8860b] hover:text-white transition-colors duration-200 rounded-[2px]"
            >
              了解更多
            </Link>
            <Link
              href="/service"
              className="px-6 py-2.5 text-sm border border-white/40 text-white hover:bg-white/10 transition-colors duration-200 rounded-[2px]"
            >
              进入服务大厅
            </Link>
          </div>
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#fafaf9] dark:from-[#0f0f1a] to-transparent" />
      </section>

      {/* Visit Stats */}
      {stats && (
        <section className="py-6 border-t border-[#e5e5e5] dark:border-[#2a2a3a]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-8 text-xs text-[#6b7280]">
              <div className="flex items-center gap-2">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>
                  总访问量：<span className="font-medium text-[#1a1a2e] dark:text-[#fafaf9]">{stats.total_count.toLocaleString()}</span>
                </span>
              </div>
              <div className="w-px h-3 bg-[#e5e5e5] dark:bg-[#2a2a3a]" />
              <div className="flex items-center gap-2">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  今日访问：<span className="font-medium text-[#1a1a2e] dark:text-[#fafaf9]">{stats.today_count.toLocaleString()}</span>
                </span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

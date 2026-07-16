"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-6xl font-serif font-bold text-[#1a1a2e] dark:text-[#fafaf9] mb-4">
          404
        </div>
        <div className="w-12 h-[2px] bg-[#b8860b] mx-auto mb-4" />
        <p className="text-sm text-[#6b7280] mb-6">
          抱歉，您访问的页面不存在
        </p>
        <Link
          href="/"
          className="inline-flex px-6 py-2 text-sm border border-[#1a1a2e] dark:border-[#fafaf9] text-[#1a1a2e] dark:text-[#fafaf9] hover:bg-[#1a1a2e] hover:text-white dark:hover:bg-[#fafaf9] dark:hover:text-[#1a1a2e] transition-colors duration-200 rounded-[2px]"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<{ type: string; title: string; href: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setResults(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-[2px] bg-[#b8860b]" />
          <span className="text-xs text-[#6b7280] tracking-widest uppercase">Search</span>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
          搜索结果
        </h1>
        {query && (
          <p className="text-sm text-[#6b7280] mt-2">
            &ldquo;{query}&rdquo; 的搜索结果
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-sm text-[#6b7280]">搜索中...</div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 text-sm text-[#6b7280]">
          {query ? "未找到相关结果" : "请输入搜索关键词"}
        </div>
      ) : (
        <div className="space-y-0">
          {results.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="block py-4 px-4 border-b border-[#e5e5e5] dark:border-[#2a2a3a] hover:bg-[#f5f5f4] dark:hover:bg-[#1e1e32] transition-colors duration-200"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-[#b8860b] border border-[#b8860b] px-1.5 py-0.5 rounded-[1px]">
                  {item.type}
                </span>
              </div>
              <div className="text-sm text-[#1a1a2e] dark:text-[#fafaf9]">{item.title}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-[#6b7280]">加载中...</div>}>
      <SearchContent />
    </Suspense>
  );
}

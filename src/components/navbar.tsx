"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "个人简介", href: "/profile" },
  { label: "通知公告", href: "/notices" },
  { label: "信息公开", href: "/disclosure" },
  { label: "服务大厅", href: "/service" },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isActive = useCallback(
    (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname.startsWith(href);
    },
    [pathname]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      }
    },
    [searchQuery]
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-transparent">
      {/* Top bar - transparent to show background */}
      <div className="bg-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-8 items-center justify-between text-xs text-white/90">
          <span>个人门户系统</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hover:text-white transition-colors duration-200"
              aria-label="搜索"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <Link href="/feedback" className="hover:text-white transition-colors duration-200">
              访客反馈
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img src="/logo.png" alt="LOGO" className="h-9 w-auto" />
            <div className="hidden sm:block">
              <div className="text-[#1a1a2e] dark:text-[#fafaf9] font-serif text-lg font-semibold tracking-wide">
                个人门户系统
              </div>
              <div className="text-[10px] text-white/50 tracking-widest uppercase">
                Personal Portal
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-4 py-2 text-sm tracking-wide transition-colors duration-200 text-white/90",
                  isActive(item.href)
                    ? "text-white font-medium"
                    : "text-white/70 hover:text-white"
                )}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#b8860b]" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-white/70 hover:text-white transition-colors duration-200"
              aria-label="切换主题"
            >
              {theme === "light" ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            {/* Login button */}
            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-1.5 text-sm border border-white/50 text-white hover:bg-white hover:text-[#1a1a2e] transition-colors duration-200 rounded-[2px]"
            >
              登录
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-white/70"
              aria-label="菜单"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-[#e5e5e5] dark:border-[#2a2a3a] bg-white dark:bg-[#0f0f1a] py-3 px-4">
          <form onSubmit={handleSearch} className="mx-auto max-w-2xl flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索通知公告、信息公开、个人咨询、个人借据..."
              className="flex-1 px-3 py-2 text-sm border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b] transition-colors"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-[#1a1a2e] text-white dark:bg-[#fafaf9] dark:text-[#1a1a2e] rounded-[2px] hover:bg-[#b8860b] dark:hover:bg-[#b8860b] dark:hover:text-white transition-colors"
            >
              搜索
            </button>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#e5e5e5] dark:border-[#2a2a3a] bg-white dark:bg-[#0f0f1a]">
          <nav className="px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-3 py-2 text-sm rounded-[2px] transition-colors duration-200",
                  isActive(item.href)
                    ? "bg-[#1a1a2e]/5 dark:bg-[#fafaf9]/5 text-[#1a1a2e] dark:text-[#fafaf9] font-medium"
                    : "text-[#6b7280] hover:text-[#1a1a2e] dark:hover:text-[#fafaf9]"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-[#b8860b] font-medium"
            >
              登录 / 注册
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

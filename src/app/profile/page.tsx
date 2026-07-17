"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type TabKey = "intro" | "honors" | "custom";

const TABS: { key: TabKey; label: string }[] = [
  { key: "intro", label: "个人介绍" },
  { key: "honors", label: "所获荣誉" },
  { key: "custom", label: "其他信息" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("intro");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-[2px] bg-[#b8860b]" />
          <span className="text-xs text-[#6b7280] dark:text-[#9ca3af] tracking-widest uppercase">Profile</span>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
          个人简介
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#e5e5e5] dark:border-[#2a2a3a] mb-8">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative px-6 py-3 text-sm transition-colors duration-200",
                activeTab === tab.key
                  ? "text-[#1a1a2e] dark:text-[#fafaf9] font-medium"
                  : "text-[#6b7280] dark:text-[#9ca3af] hover:text-[#1a1a2e] dark:hover:text-[#fafaf9]"
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#b8860b]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "intro" && <IntroTab />}
        {activeTab === "honors" && <HonorsTab />}
        {activeTab === "custom" && <CustomTab />}
      </div>
    </div>
  );
}

function IntroTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* Photo */}
      <div className="lg:col-span-1">
        <div className="aspect-[3/4] bg-[#f5f5f4] dark:bg-[#1e1e32] rounded-[2px] overflow-hidden">
          <img
            src="/profile-photo.jpg"
            alt="强嘉伟"
            className="w-full h-full object-cover object-top"
          />
        </div>
      </div>

      {/* Info */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9] mb-1">
            强嘉伟
          </h2>
          <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">初级职称 / 学生</p>
        </div>

        <div className="h-px bg-[#e5e5e5] dark:bg-[#2a2a3a]" />

        <div className="space-y-4 text-sm leading-relaxed text-[#374151] dark:text-[#d1d5db]">
          <p>
            强嘉伟，学生，初级职称。致力于专业领域的学习与研究，不断追求学术进步与个人成长。
          </p>
        </div>

        <div className="h-px bg-[#e5e5e5] dark:bg-[#2a2a3a]" />

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#6b7280] dark:text-[#9ca3af]">电子邮箱</span>
            <p className="text-[#1a1a2e] dark:text-[#fafaf9] mt-1">jiawei-qiang@foxmail.com</p>
          </div>
          <div>
            <span className="text-[#6b7280] dark:text-[#9ca3af]">联系电话</span>
            <p className="text-[#1a1a2e] dark:text-[#fafaf9] mt-1">+86 15398575367（优先）</p>
            <p className="text-[#1a1a2e] dark:text-[#fafaf9]">+86 17791789885</p>
          </div>
          <div>
            <span className="text-[#6b7280] dark:text-[#9ca3af]">微信</span>
            <p className="text-[#1a1a2e] dark:text-[#fafaf9] mt-1">wxid_cl8nra6s3bp322</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HonorsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9] mb-1">
          所获荣誉
        </h2>
        <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">Honors & Awards</p>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#2a2a3a]" />

      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 border border-[#e5e5e5] dark:border-[#2a2a3a] rounded-[2px]">
          <div className="w-2 h-2 mt-2 bg-[#b8860b] rounded-full shrink-0" />
          <div>
            <p className="text-sm font-medium text-[#1a1a2e] dark:text-[#fafaf9]">荣誉待补充</p>
            <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-1">请在管理员后台添加荣誉信息</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9] mb-1">
          其他信息
        </h2>
        <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">Additional Information</p>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#2a2a3a]" />

      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 border border-[#e5e5e5] dark:border-[#2a2a3a] rounded-[2px]">
          <div className="w-2 h-2 mt-2 bg-[#b8860b] rounded-full shrink-0" />
          <div>
            <p className="text-sm font-medium text-[#1a1a2e] dark:text-[#fafaf9]">自定义板块</p>
            <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-1">此板块内容待补充，可在管理员后台进行编辑</p>
          </div>
        </div>
      </div>
    </div>
  );
}

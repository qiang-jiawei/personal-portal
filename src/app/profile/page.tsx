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
          <span className="text-xs text-[#6b7280] tracking-widest uppercase">Profile</span>
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
                  : "text-[#6b7280] hover:text-[#1a1a2e] dark:hover:text-[#fafaf9]"
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
          <div className="w-full h-full flex items-center justify-center text-[#6b7280]">
            <svg className="h-16 w-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9] mb-1">
            姓名
          </h2>
          <p className="text-sm text-[#6b7280]">职称 / 职务</p>
        </div>

        <div className="h-px bg-[#e5e5e5] dark:bg-[#2a2a3a]" />

        <div className="space-y-4 text-sm leading-relaxed text-[#374151] dark:text-[#d1d5db]">
          <p>
            此处为个人简介内容。请根据实际情况编辑个人信息、教育背景、研究方向、工作经历等内容。
          </p>
          <p>
            可以在此处展示学术成果、研究兴趣、社会兼职等信息，全面呈现个人专业形象。
          </p>
        </div>

        <div className="h-px bg-[#e5e5e5] dark:bg-[#2a2a3a]" />

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#6b7280] text-xs">电子邮箱</span>
            <p className="text-[#1a1a2e] dark:text-[#fafaf9]">example@email.com</p>
          </div>
          <div>
            <span className="text-[#6b7280] text-xs">办公电话</span>
            <p className="text-[#1a1a2e] dark:text-[#fafaf9]">+86 XXX-XXXX-XXXX</p>
          </div>
          <div>
            <span className="text-[#6b7280] text-xs">办公地点</span>
            <p className="text-[#1a1a2e] dark:text-[#fafaf9]">XX楼XXX室</p>
          </div>
          <div>
            <span className="text-[#6b7280] text-xs">通信地址</span>
            <p className="text-[#1a1a2e] dark:text-[#fafaf9]">详细地址</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HonorsTab() {
  const honors = [
    { year: "2024", title: "荣誉奖项名称", org: "颁发机构" },
    { year: "2023", title: "荣誉奖项名称", org: "颁发机构" },
    { year: "2022", title: "荣誉奖项名称", org: "颁发机构" },
    { year: "2021", title: "荣誉奖项名称", org: "颁发机构" },
  ];

  return (
    <div className="space-y-0">
      {honors.map((honor, idx) => (
        <div
          key={idx}
          className="flex items-start gap-6 py-5 border-b border-[#e5e5e5] dark:border-[#2a2a3a] last:border-b-0"
        >
          <span className="text-sm font-medium text-[#b8860b] w-12 shrink-0">
            {honor.year}
          </span>
          <div>
            <h3 className="text-sm font-medium text-[#1a1a2e] dark:text-[#fafaf9]">
              {honor.title}
            </h3>
            <p className="text-xs text-[#6b7280] mt-1">{honor.org}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomTab() {
  return (
    <div className="space-y-6">
      <div className="border border-dashed border-[#e5e5e5] dark:border-[#2a2a3a] rounded-[2px] p-12 text-center">
        <svg className="h-10 w-10 mx-auto text-[#6b7280] opacity-40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="text-sm text-[#6b7280]">
          自定义板块 — 可根据需要添加更多内容
        </p>
        <p className="text-xs text-[#6b7280] mt-2">
          此板块为预留内容区域，可在管理员后台进行编辑
        </p>
      </div>
    </div>
  );
}

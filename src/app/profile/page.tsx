"use client";

import { useState, useEffect } from "react";
import { Award, BookOpen, Briefcase, GraduationCap, Mail, Phone, MapPin, Github, Linkedin, ChevronDown, ChevronUp } from "lucide-react";

interface Honor {
  id: string;
  title: string;
  description: string;
  organization: string;
  date: string;
  category: string;
  sort_order: number;
}

export default function ProfilePage() {
  const [honors, setHonors] = useState<Honor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    '知识产权': true,
    '考试证书': false,
    '学科竞赛': false,
    '荣誉奖项': false,
    '其他': false,
  });

  useEffect(() => {
    fetch("/api/honors")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHonors(data.data);
        }
      })
      .catch((error) => {
        console.error("获取荣誉数据失败:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // 分类荣誉
  const categoryMap: Record<string, Honor[]> = {
    '知识产权': [],
    '考试证书': [],
    '学科竞赛': [],
    '荣誉奖项': [],
    '其他': [],
  };
  
  honors.forEach((h) => {
    if (categoryMap[h.category]) {
      categoryMap[h.category].push(h);
    } else {
      categoryMap['其他'].push(h);
    }
  });
  
  // 每个分类内按 sort_order 排序
  Object.keys(categoryMap).forEach((key) => {
    categoryMap[key].sort((a, b) => a.sort_order - b.sort_order);
  });

  const renderHonorItem = (honor: Honor, index: number) => (
    <div key={honor.id} className="group relative">
      <div className="absolute -left-3 top-2 h-2 w-2 rounded-full bg-[#b8860b] opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start gap-3 rounded-lg border border-[#e5e5e5] bg-white p-4 transition-all hover:border-[#b8860b] hover:shadow-sm dark:border-[#2a2a3a] dark:bg-[#1a1a2e]">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-[#1a1a2e] text-sm font-bold text-[#b8860b] dark:bg-[#b8860b] dark:text-[#1a1a2e]">
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-[#1a1a1a] dark:text-[#fafaf9]">{honor.title}</h4>
            <span className="flex-shrink-0 rounded bg-[#1a1a2e] px-2 py-0.5 text-xs text-[#b8860b] dark:bg-[#b8860b] dark:text-[#1a1a2e]">
              {honor.date}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#6b7280]">{honor.description}</p>
          <p className="mt-1 text-xs text-[#6b7280]">{honor.organization}</p>
        </div>
      </div>
    </div>
  );

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    items: Honor[],
    sectionKey: string
  ) => (
    <div className="space-y-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex w-full items-center justify-between border-b border-[#e5e5e5] pb-2 dark:border-[#2a2a3a]"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">{title}</h3>
          <span className="text-sm text-[#6b7280]">({items.length})</span>
        </div>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="h-5 w-5 text-[#6b7280]" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#6b7280]" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="space-y-3">
          {items.map((honor, index) => renderHonorItem(honor, index))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0f0f1a]">
      {/* 头部区域 */}
      <div className="border-b border-[#e5e5e5] bg-white dark:border-[#2a2a3a] dark:bg-[#1a1a2e]">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#b8860b] text-4xl font-bold text-white">
              强
            </div>
            <h1 className="mb-2 text-3xl font-bold text-[#1a1a2e] dark:text-[#fafaf9]">
              强嘉伟
            </h1>
            <p className="mb-4 text-lg text-[#6b7280]">
              全栈开发者 · 人工智能与云计算方向
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-[#6b7280]">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>jiawei-qiang@foxmail.com</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span>15398575367 / 17791789885</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>云南昆明 & 陕西扶风</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* 左侧 - 个人信息 */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* 个人简介 */}
              <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a3a] dark:bg-[#1a1a2e]">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
                  <BookOpen className="h-5 w-5 text-[#b8860b]" />
                  个人简介
                </h3>
                <p className="text-sm leading-relaxed text-[#6b7280]">
                  热爱技术，专注于人工智能与云计算领域。具备扎实的计算机基础知识和编程能力，
                  熟悉 Python、Java 等编程语言，了解大模型应用开发。
                  在校期间积极参与各类技术竞赛和项目实践，不断提升自己的专业技能。
                </p>
              </div>

              {/* 教育背景 */}
              <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a3a] dark:bg-[#1a1a2e]">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
                  <GraduationCap className="h-5 w-5 text-[#b8860b]" />
                  教育背景
                </h3>
                <div className="space-y-4">
                  <div className="relative border-l-2 border-[#e5e5e5] pl-4 dark:border-[#2a2a3a]">
                    <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-[#b8860b]" />
                    <div className="font-medium text-[#1a1a1a] dark:text-[#fafaf9]">滇池学院</div>
                    <div className="text-sm text-[#6b7280]">人工智能专业 · 本科</div>
                    <div className="text-xs text-[#6b7280]">2024.08 - 2028.07（预计）</div>
                  </div>
                  <div className="relative border-l-2 border-[#e5e5e5] pl-4 dark:border-[#2a2a3a]">
                    <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-[#6b7280]" />
                    <div className="font-medium text-[#1a1a1a] dark:text-[#fafaf9]">扶风县法门高中</div>
                    <div className="text-sm text-[#6b7280]">高中</div>
                    <div className="text-xs text-[#6b7280]">2021.09 - 2024.06</div>
                  </div>
                  <div className="relative border-l-2 border-[#e5e5e5] pl-4 dark:border-[#2a2a3a]">
                    <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-[#6b7280]" />
                    <div className="font-medium text-[#1a1a1a] dark:text-[#fafaf9]">扶风县天度镇南阳初级中学</div>
                    <div className="text-sm text-[#6b7280]">初中</div>
                    <div className="text-xs text-[#6b7280]">2018.09 - 2021.06</div>
                  </div>
                  <div className="relative border-l-2 border-[#e5e5e5] pl-4 dark:border-[#2a2a3a]">
                    <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-[#6b7280]" />
                    <div className="font-medium text-[#1a1a1a] dark:text-[#fafaf9]">扶风县天度镇天度中心小学</div>
                    <div className="text-sm text-[#6b7280]">小学</div>
                    <div className="text-xs text-[#6b7280]">2012.09 - 2018.06</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧 - 所获荣誉 + 技能/社交 */}
          <div className="lg:col-span-2">
            {/* 所获荣誉 */}
            <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a3a] dark:bg-[#1a1a2e]">
              <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
                <Award className="h-6 w-6 text-[#b8860b]" />
                所获荣誉
              </h3>

              {loading ? (
                <div className="py-8 text-center text-[#6b7280]">加载中...</div>
              ) : (
                <div className="space-y-6">
                  {renderSection("知识产权", <Award className="h-5 w-5 text-[#b8860b]" />, honors.filter(h => h.category === "知识产权"), "ip")}
                  {renderSection("荣誉奖项", <GraduationCap className="h-5 w-5 text-[#b8860b]" />, honors.filter(h => h.category === "荣誉奖项"), "honor")}
                  {renderSection("考试证书", <BookOpen className="h-5 w-5 text-[#b8860b]" />, honors.filter(h => h.category === "考试证书"), "exam")}
                  {renderSection("学科竞赛", <Award className="h-5 w-5 text-[#b8860b]" />, honors.filter(h => h.category === "学科竞赛"), "competition")}
                  {renderSection("其他", <Briefcase className="h-5 w-5 text-[#b8860b]" />, honors.filter(h => h.category === "其他"), "other")}
                </div>
              )}
            </div>

            {/* 技能特长 + 社交链接 并排 */}
            <div className="mt-6 grid grid-cols-2 gap-6">
              {/* 技能标签 */}
              <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a3a] dark:bg-[#1a1a2e]">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
                  <Briefcase className="h-5 w-5 text-[#b8860b]" />
                  技能特长
                </h3>
                <div className="flex flex-wrap gap-2">
                  {["Python", "Java", "人工智能", "云计算", "大模型", "Next.js", "Supabase"].map(
                    (skill) => (
                      <span
                        key={skill}
                        className="rounded bg-[#1a1a2e] px-3 py-1 text-xs text-[#b8860b] dark:bg-[#b8860b] dark:text-[#1a1a2e]"
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* 社交链接 */}
              <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a3a] dark:bg-[#1a1a2e]">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
                  <Github className="h-5 w-5 text-[#b8860b]" />
                  社交链接
                </h3>
                <div className="space-y-2">
                  <a
                    href="https://github.com/qiang-jiawei"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#b8860b]"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                  <a
                    href="mailto:jiawei-qiang@foxmail.com"
                    className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#b8860b]"
                  >
                    <Mail className="h-4 w-4" />
                    jiawei-qiang@foxmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

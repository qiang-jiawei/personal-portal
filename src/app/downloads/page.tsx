"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Download {
  id: string;
  title: string;
  category: string;
  file_url: string;
  file_size: number;
  file_type: string;
  description: string;
  download_count: number;
  created_at: string;
}

const categories = ["全部", "Word", "Excel", "PPT", "PDF", "压缩包", "视频", "音频", "其他"];

const categoryIcons: Record<string, string> = {
  Word: "📄",
  Excel: "📊",
  PPT: "📽️",
  PDF: "📕",
  压缩包: "🗜️",
  视频: "🎬",
  音频: "🎵",
  其他: "📦",
};

const fileExtensions: Record<string, string> = {
  doc: "Word",
  docx: "Word",
  xls: "Excel",
  xlsx: "Excel",
  ppt: "PPT",
  pptx: "PPT",
  pdf: "PDF",
  zip: "压缩包",
  rar: "压缩包",
  "7z": "压缩包",
  mp4: "视频",
  avi: "视频",
  mov: "视频",
  mp3: "音频",
  wav: "音频",
  flac: "音频",
};

function getFileCategory(fileType: string): string {
  const ext = fileType.toLowerCase().replace(".", "");
  return fileExtensions[ext] || "其他";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "未知大小";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [activeCategory, setActiveCategory] = useState("全部");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDownloads();
  }, [activeCategory]);

  const fetchDownloads = async () => {
    setLoading(true);
    try {
      const url = activeCategory === "全部"
        ? "/api/downloads"
        : `/api/downloads?category=${encodeURIComponent(activeCategory)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setDownloads(data.data);
      } else {
        console.error("获取下载列表失败:", data.error);
      }
    } catch (error) {
      console.error("获取下载列表异常:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (download: Download) => {
    // 增加下载次数
    try {
      await fetch("/api/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: download.id }),
      });
    } catch (error) {
      console.error("更新下载次数失败:", error);
    }

    // 下载文件
    const link = document.createElement("a");
    link.href = download.file_url;
    link.download = download.title;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0f0f1a]">
      {/* 页面标题 */}
      <div className="bg-[#1a1a2e] dark:bg-[#0a0a15] text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-serif">下载中心</h1>
          <p className="mt-3 text-gray-300 text-sm">提供各类文档、资料、多媒体文件下载</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 分类标签 */}
        <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-[#e5e5e5] dark:border-[#2a2a3a]">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 text-sm transition-colors ${
                activeCategory === category
                  ? "bg-[#1a1a2e] text-white dark:bg-[#b8860b]"
                  : "bg-white text-[#1a1a1a] border border-[#e5e5e5] hover:bg-gray-50 dark:bg-[#1a1a2e] dark:text-gray-300 dark:border-[#2a2a3a]"
              }`}
            >
              {categoryIcons[category]} {category}
            </button>
          ))}
        </div>

        {/* 下载列表 */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : downloads.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无下载文件
          </div>
        ) : (
          <div className="grid gap-4">
            {downloads.map((download) => (
              <div
                key={download.id}
                className="bg-white dark:bg-[#1a1a2e] border border-[#e5e5e5] dark:border-[#2a2a3a] p-6 hover:border-[#b8860b] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{categoryIcons[download.category] || "📦"}</span>
                      <h3 className="text-lg font-medium text-[#1a1a1a] dark:text-white">
                        {download.title}
                      </h3>
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-[#2a2a3a] text-gray-600 dark:text-gray-400">
                        {download.category}
                      </span>
                    </div>
                    {download.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 ml-10">
                        {download.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500 ml-10">
                      <span>大小：{formatFileSize(download.file_size)}</span>
                      <span>类型：{download.file_type || "未知"}</span>
                      <span>下载：{download.download_count} 次</span>
                      <span>
                        上传：{new Date(download.created_at).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(download)}
                    className="ml-4 px-4 py-2 bg-[#1a1a2e] text-white text-sm hover:bg-[#b8860b] transition-colors whitespace-nowrap"
                  >
                    下载
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

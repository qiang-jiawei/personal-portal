"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Code2, ExternalLink, Search, Loader2 } from "lucide-react";

interface CodeProject {
  id: string;
  title: string;
  description: string;
  file_url: string;
  tags: string;
  sort_order: number;
  created_at?: string;
}

export default function CodeLabPage() {
  const [projects, setProjects] = useState<CodeProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/code-projects");
      const data = await res.json();
      if (data.success) setProjects(data.data || []);
    } catch (error) {
      console.error("获取作品列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = projects.filter((p) => {
    const kw = search.trim().toLowerCase();
    if (!kw) return true;
    return (
      p.title.toLowerCase().includes(kw) ||
      (p.description || "").toLowerCase().includes(kw) ||
      (p.tags || "").toLowerCase().includes(kw)
    );
  });

  const openProject = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="container py-12 px-4">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
          <Code2 className="w-8 h-8 text-[#b8860b]" />
          代码实验室
        </h1>
        <p className="text-muted-foreground">
          一些有趣的小代码与可交互 Demo，点击卡片在新窗口中打开运行。
        </p>
      </div>

      <div className="mb-8 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索作品名称或标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#b8860b]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded">
          <Code2 className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-40" />
          <p className="text-muted-foreground">
            {projects.length === 0 ? "暂无作品，敬请期待" : "未找到匹配的作品"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((project, idx) => (
            <Card
              key={project.id}
              onClick={() => openProject(project.file_url)}
              className="cursor-pointer group transition-all duration-200 hover:border-[#b8860b]/60 hover:shadow-sm"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#b8860b]/10 rounded text-[#b8860b] font-serif text-lg shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-[#b8860b] transition-colors">
                      {project.title}
                    </h3>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
                  {project.description || "暂无描述，点击打开体验。"}
                </p>

                {project.tags && (
                  <div className="flex flex-wrap gap-2">
                    {project.tags
                      .split(/[,，、\s]+/)
                      .filter(Boolean)
                      .map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs border rounded text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:border-[#b8860b] group-hover:text-[#b8860b]"
                    onClick={(e) => {
                      e.stopPropagation();
                      openProject(project.file_url);
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    点击运行
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

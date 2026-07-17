"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

type AdminTab = "users" | "consultations" | "requests" | "ious" | "content" | "feedback" | "logs";

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  useEffect(() => {
    fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.is_admin) setIsAdmin(true);
        else router.push("/login");
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/");
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-[#6b7280]">加载中...</div>;
  }
  if (!isAdmin) return null;

  const tabs: { key: AdminTab; label: string }[] = [
    { key: "users", label: "用户管理" },
    { key: "consultations", label: "咨询管理" },
    { key: "requests", label: "申请管理" },
    { key: "ious", label: "借据台账" },
    { key: "content", label: "内容管理" },
    { key: "feedback", label: "反馈管理" },
    { key: "logs", label: "操作日志" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#1a1a2e] dark:text-[#fafaf9]">
            管理员后台
          </h1>
          <p className="text-xs text-[#6b7280] mt-1">全站数据管理</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs text-[#6b7280] hover:text-[#b8860b] transition-colors">
            返回首页
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs border border-[#e5e5e5] dark:border-[#2a2a3a] text-[#6b7280] hover:text-red-600 hover:border-red-600 transition-colors rounded-[2px]"
          >
            退出管理
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#e5e5e5] dark:border-[#2a2a3a] mb-6 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative px-4 py-2.5 text-xs whitespace-nowrap transition-colors duration-200",
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

      {/* Content */}
      {activeTab === "users" && <UsersPanel />}
      {activeTab === "consultations" && <ConsultationsPanel />}
      {activeTab === "requests" && <RequestsPanel />}
      {activeTab === "ious" && <IousPanel />}
      {activeTab === "content" && <ContentPanel />}
      {activeTab === "feedback" && <FeedbackPanel />}
      {activeTab === "logs" && <LogsPanel />}
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<Array<{ id: string; phone: string; name: string; is_active: boolean; is_frozen: boolean; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) { setUsers(data.data); setError(""); }
      else setError(data.error || "获取用户列表失败");
    } catch { setError("网络请求失败，请检查 Supabase 配置"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleFreeze = async (id: string, current: boolean) => {
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id, action: current ? "unfreeze" : "freeze" }),
    });
    fetchUsers();
  };

  const deactivate = async (id: string) => {
    if (!confirm("确定注销该用户？")) return;
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id, action: "deactivate" }),
    });
    fetchUsers();
  };

  if (loading) return <div className="text-sm text-[#6b7280] py-8 text-center">加载中...</div>;
  if (error) return <div className="text-sm text-red-400 py-8 text-center">{error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e5e5e5] dark:border-[#2a2a3a] text-left">
            <th className="py-2 px-3 text-xs font-medium text-[#6b7280]">手机号</th>
            <th className="py-2 px-3 text-xs font-medium text-[#6b7280]">姓名</th>
            <th className="py-2 px-3 text-xs font-medium text-[#6b7280]">状态</th>
            <th className="py-2 px-3 text-xs font-medium text-[#6b7280]">注册时间</th>
            <th className="py-2 px-3 text-xs font-medium text-[#6b7280]">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-[#e5e5e5] dark:border-[#2a2a3a]">
              <td className="py-2 px-3 text-[#1a1a2e] dark:text-[#fafaf9]">{u.phone}</td>
              <td className="py-2 px-3 text-[#6b7280]">{u.name}</td>
              <td className="py-2 px-3">
                {!u.is_active ? (
                  <span className="text-[10px] text-red-600 border border-red-600 px-1.5 py-0.5 rounded-[1px]">已注销</span>
                ) : u.is_frozen ? (
                  <span className="text-[10px] text-amber-600 border border-amber-600 px-1.5 py-0.5 rounded-[1px]">已冻结</span>
                ) : (
                  <span className="text-[10px] text-green-600 border border-green-600 px-1.5 py-0.5 rounded-[1px]">正常</span>
                )}
              </td>
              <td className="py-2 px-3 text-[#6b7280] text-xs">{new Date(u.created_at).toLocaleDateString("zh-CN")}</td>
              <td className="py-2 px-3">
                {u.is_active && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFreeze(u.id, u.is_frozen)}
                      className="text-[10px] text-[#b8860b] hover:underline"
                    >
                      {u.is_frozen ? "解冻" : "冻结"}
                    </button>
                    <button onClick={() => deactivate(u.id)} className="text-[10px] text-red-600 hover:underline">
                      注销
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={5} className="py-8 text-center text-[#6b7280]">暂无用户</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ConsultationsPanel() {
  const [items, setItems] = useState<Array<{ id: string; title: string; content: string; contact: string; status: string; reply: string | null; user_id: string }>>([]);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/consultations");
      const data = await res.json();
      if (data.success) { setItems(data.data); setError(null); }
      else setError(data.error || "加载失败");
    } catch (e) { setError("网络错误，请检查 Supabase 配置"); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const submitReply = async (id: string) => {
    if (!replyText.trim()) return;
    await fetch("/api/admin/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consultation_id: id, reply: replyText.trim() }),
    });
    setReplyId(null);
    setReplyText("");
    fetchItems();
  };

  return (
    <div className="space-y-0">
      {error && <div className="p-4 text-sm text-red-500">{error}</div>}
      {items.length === 0 && !error && <div className="p-8 text-center text-sm text-[#6b7280]">暂无咨询记录</div>}
      {items.map((item) => (
        <div key={item.id} className="py-4 px-4 border-b border-[#e5e5e5] dark:border-[#2a2a3a]">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-[#1a1a2e] dark:text-[#fafaf9]">{item.title}</h3>
            <span className="text-[10px] text-[#6b7280]">{item.status}</span>
          </div>
          <p className="text-xs text-[#6b7280] mb-2">{item.content}</p>
          <p className="text-[10px] text-[#6b7280]">联系方式: {item.contact}</p>
          {item.reply && <div className="mt-2 p-2 bg-[#f5f5f4] dark:bg-[#1e1e32] rounded-[2px] text-xs text-[#374151] dark:text-[#d1d5db]">回复: {item.reply}</div>}
          {replyId === item.id ? (
            <div className="mt-3 flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b]"
                placeholder="输入回复内容"
              />
              <button onClick={() => submitReply(item.id)} className="px-3 py-1.5 text-xs bg-[#1a1a2e] text-white dark:bg-[#fafaf9] dark:text-[#1a1a2e] rounded-[2px]">发送</button>
              <button onClick={() => setReplyId(null)} className="px-3 py-1.5 text-xs border border-[#e5e5e5] dark:border-[#2a2a3a] text-[#6b7280] rounded-[2px]">取消</button>
            </div>
          ) : (
            <button onClick={() => setReplyId(item.id)} className="mt-2 text-[10px] text-[#b8860b] hover:underline">回复</button>
          )}
        </div>
      ))}
      {items.length === 0 && <div className="py-8 text-center text-sm text-[#6b7280]">暂无咨询</div>}
    </div>
  );
}

function RequestsPanel() {
  const [items, setItems] = useState<Array<{ id: string; title: string; content: string; contact: string; status: string; reply: string | null }>>([]);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState("");

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/admin/disclosure-requests");
    const data = await res.json();
    if (data.success) { setItems(data.data); setError(""); }
    else setError(data.error || "加载失败");
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const submitReply = async (id: string) => {
    if (!replyText.trim()) return;
    await fetch("/api/admin/disclosure-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: id, reply: replyText.trim() }),
    });
    setReplyId(null);
    setReplyText("");
    fetchItems();
  };

  return (
    <div className="space-y-0">
      {error && <div className="py-3 px-4 text-xs text-red-500">{error}</div>}
      {items.map((item) => (
        <div key={item.id} className="py-4 px-4 border-b border-[#e5e5e5] dark:border-[#2a2a3a]">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-[#1a1a2e] dark:text-[#fafaf9]">{item.title}</h3>
            <span className="text-[10px] text-[#6b7280]">{item.status}</span>
          </div>
          <p className="text-xs text-[#6b7280] mb-2">{item.content}</p>
          <p className="text-[10px] text-[#6b7280]">联系方式: {item.contact}</p>
          {item.reply && <div className="mt-2 p-2 bg-[#f5f5f4] dark:bg-[#1e1e32] rounded-[2px] text-xs text-[#374151] dark:text-[#d1d5db]">回复: {item.reply}</div>}
          {replyId === item.id ? (
            <div className="mt-3 flex gap-2">
              <input value={replyText} onChange={(e) => setReplyText(e.target.value)} className="flex-1 px-2 py-1.5 text-xs border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b]" placeholder="输入回复" />
              <button onClick={() => submitReply(item.id)} className="px-3 py-1.5 text-xs bg-[#1a1a2e] text-white dark:bg-[#fafaf9] dark:text-[#1a1a2e] rounded-[2px]">发送</button>
              <button onClick={() => setReplyId(null)} className="px-3 py-1.5 text-xs border border-[#e5e5e5] dark:border-[#2a2a3a] text-[#6b7280] rounded-[2px]">取消</button>
            </div>
          ) : (
            <button onClick={() => setReplyId(item.id)} className="mt-2 text-[10px] text-[#b8860b] hover:underline">回复</button>
          )}
        </div>
      ))}
      {items.length === 0 && <div className="py-8 text-center text-sm text-[#6b7280]">暂无申请</div>}
    </div>
  );
}

function IousPanel() {
  const [ious, setIous] = useState<Array<{ id: string; document_no: string; borrower_phone: string; borrower_name: string | null; status: string; amount: string | null; created_at: string }>>([]);
  const [iousError, setIousError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newDocNo, setNewDocNo] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const fetchIous = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ious");
      const data = await res.json();
      if (data.success) { setIous(data.data); setIousError(""); }
      else { setIousError(data.error || "加载失败"); }
    } catch { setIousError("网络错误，请检查 Supabase 配置"); }
  }, []);

  useEffect(() => { fetchIous(); }, [fetchIous]);

  const createIou = async () => {
    if (!newPhone.trim() || !newDocNo.trim()) return;
    const res = await fetch("/api/admin/ious", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrower_phone: newPhone.trim(), document_no: newDocNo.trim(), amount: newAmount.trim() || null }),
    });
    const data = await res.json();
    if (data.success) {
      setShowCreate(false);
      setNewPhone(""); setNewDocNo(""); setNewAmount("");
      fetchIous();
    } else {
      alert("录入失败: " + (data.error || "未知错误"));
    }
  };

  const changeStatus = async (id: string, status: string) => {
    await fetch("/api/admin/ious", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ iou_id: id, status }),
    });
    fetchIous();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[#1a1a2e] dark:text-[#fafaf9]">借据总台账</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="px-3 py-1.5 text-xs bg-[#1a1a2e] text-white dark:bg-[#fafaf9] dark:text-[#1a1a2e] rounded-[2px]">
          {showCreate ? "取消" : "录入借据"}
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 p-4 border border-[#e5e5e5] dark:border-[#2a2a3a] rounded-[2px] space-y-3">
          <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b]" placeholder="借款人手机号" />
          <input value={newDocNo} onChange={(e) => setNewDocNo(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b]" placeholder="借条编号" />
          <input value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] focus:outline-none focus:border-[#b8860b]" placeholder="金额（选填）" />
          <button onClick={createIou} className="px-4 py-1.5 text-xs bg-[#b8860b] text-white rounded-[2px]">确认录入</button>
        </div>
      )}

      {iousError && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[2px] text-red-600 dark:text-red-400 text-xs">{iousError}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e5e5] dark:border-[#2a2a3a] text-left">
              <th className="py-2 px-3 text-xs font-medium text-[#6b7280]">编号</th>
              <th className="py-2 px-3 text-xs font-medium text-[#6b7280]">用户</th>
              <th className="py-2 px-3 text-xs font-medium text-[#6b7280]">金额</th>
              <th className="py-2 px-3 text-xs font-medium text-[#6b7280]">状态</th>
              <th className="py-2 px-3 text-xs font-medium text-[#6b7280]">操作</th>
            </tr>
          </thead>
          <tbody>
            {ious.length === 0 && !iousError && (
              <tr><td colSpan={5} className="py-8 text-center text-[#6b7280] text-xs">暂无借据数据</td></tr>
            )}
            {ious.map((iou) => (
              <tr key={iou.id} className="border-b border-[#e5e5e5] dark:border-[#2a2a3a]">
                <td className="py-2 px-3 text-[#1a1a2e] dark:text-[#fafaf9] text-xs">{iou.document_no}</td>
                <td className="py-2 px-3 text-[#6b7280] text-xs">{iou.borrower_name || "-"} <span className="text-[10px] text-[#9ca3af]">({iou.borrower_phone})</span></td>
                <td className="py-2 px-3 text-[#6b7280] text-xs">{iou.amount || "-"}</td>
                <td className="py-2 px-3">
                  <span className={cn("text-[10px] border px-1.5 py-0.5 rounded-[1px]",
                    iou.status === "valid" && "text-green-600 border-green-600",
                    iou.status === "expired" && "text-amber-600 border-amber-600",
                    iou.status === "invalid" && "text-red-600 border-red-600"
                  )}>
                    {iou.status === "valid" ? "有效" : iou.status === "expired" ? "失效" : "无效"}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <select
                    value={iou.status}
                    onChange={(e) => changeStatus(iou.id, e.target.value)}
                    className="text-[10px] border border-[#e5e5e5] dark:border-[#2a2a3a] bg-transparent rounded-[2px] px-1 py-0.5"
                  >
                    <option value="valid">有效</option>
                    <option value="expired">失效</option>
                    <option value="invalid">无效</option>
                  </select>
                </td>
              </tr>
            ))}
            {ious.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-[#6b7280]">暂无借据</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContentPanel() {
  return (
    <div className="py-8 text-center">
      <div className="border border-dashed border-[#e5e5e5] dark:border-[#2a2a3a] rounded-[2px] p-12">
        <p className="text-sm text-[#6b7280]">内容管理功能</p>
        <p className="text-xs text-[#6b7280] mt-2">可在此处修改首页大图、增删通知公告、上传PDF文件</p>
        <p className="text-xs text-[#6b7280] mt-1">该功能将在后续迭代中完善</p>
      </div>
    </div>
  );
}

function FeedbackPanel() {
  const [items, setItems] = useState<Array<{ id: string; type: string; content: string; contact: string | null; status: string; created_at: string }>>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/feedback").then((r) => r.json()).then((d) => {
      if (d.success) setItems(d.data);
      else setError(d.error || "加载失败");
    }).catch((e) => setError("网络错误: " + e.message));
  }, []);

  return (
    <div className="space-y-0">
      {error && <div className="py-3 px-4 text-xs text-red-500">{error}</div>}
      {items.map((item) => (
        <div key={item.id} className="py-4 px-4 border-b border-[#e5e5e5] dark:border-[#2a2a3a]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] border border-[#b8860b] text-[#b8860b] px-1.5 py-0.5 rounded-[1px]">
              {item.type === "bug" ? "BUG" : "建议"}
            </span>
            <span className="text-[10px] text-[#6b7280]">{new Date(item.created_at).toLocaleDateString("zh-CN")}</span>
          </div>
          <p className="text-xs text-[#374151] dark:text-[#d1d5db]">{item.content}</p>
          {item.contact && <p className="text-[10px] text-[#6b7280] mt-1">联系方式: {item.contact}</p>}
        </div>
      ))}
      {items.length === 0 && <div className="py-8 text-center text-sm text-[#6b7280]">暂无反馈</div>}
    </div>
  );
}

function LogsPanel() {
  const [logs, setLogs] = useState<Array<{ id: string; action: string; detail: string | null; created_at: string }>>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/logs").then((r) => r.json()).then((d) => {
      if (d.success) setLogs(d.data);
      else setError(d.error || "加载失败");
    }).catch((e) => setError("网络错误: " + e.message));
  }, []);

  return (
    <div className="space-y-0">
      {error && <div className="py-3 px-4 text-xs text-red-500">{error}</div>}
      {logs.map((log) => (
        <div key={log.id} className="py-3 px-4 border-b border-[#e5e5e5] dark:border-[#2a2a3a] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#1a1a2e] dark:text-[#fafaf9]">{log.action}</span>
            {log.detail && <span className="text-xs text-[#6b7280] ml-2">{log.detail}</span>}
          </div>
          <span className="text-[10px] text-[#6b7280]">{new Date(log.created_at).toLocaleString("zh-CN")}</span>
        </div>
      ))}
      {logs.length === 0 && <div className="py-8 text-center text-sm text-[#6b7280]">暂无日志</div>}
    </div>
  );
}

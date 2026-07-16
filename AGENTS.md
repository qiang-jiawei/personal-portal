# AGENTS.md

## 项目概览

个人门户网站，基于 Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Supabase。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)

## 目录结构

```
src/
├── app/
│   ├── page.tsx                  # 首页（全屏大图+欢迎文字+访问统计）
│   ├── profile/                  # 个人简介（标签切换）
│   ├── notices/                  # 通知公告
│   ├── disclosure/               # 信息公开
│   ├── service/                  # 服务大厅
│   │   ├── consultation/         # 在线咨询
│   │   ├── disclosure-request/   # 信息申请公开
│   │   └── finance/              # 财务管理（借据查询+核验）
│   ├── login/                    # 登录/注册
│   ├── forgot-password/          # 忘记密码
│   ├── feedback/                 # 访客反馈
│   ├── search/                   # 全局搜索
│   ├── admin/                    # 管理员后台
│   ├── api/                      # API路由
│   │   ├── auth/                 # 用户认证
│   │   ├── admin-auth/           # 管理员认证
│   │   ├── visit/                # 访问统计
│   │   ├── notices/              # 通知公告数据
│   │   ├── disclosure/           # 信息公开数据
│   │   ├── feedback/             # 反馈数据
│   │   ├── search/               # 搜索
│   │   ├── consultations/        # 在线咨询
│   │   ├── disclosure-requests/  # 信息申请
│   │   ├── ious/                 # 借据（含verify子路由）
│   │   └── admin/                # 管理员API
│   ├── layout.tsx                # 全局布局
│   ├── globals.css               # 全局样式
│   ├── not-found.tsx             # 404页面
│   └── error.tsx                 # 500页面
├── components/
│   ├── navbar.tsx                # 导航栏
│   ├── footer.tsx                # 页脚
│   ├── theme-provider.tsx        # 主题切换
│   └── ui/                      # shadcn/ui组件
├── storage/database/             # Supabase数据库
│   ├── supabase-client.ts        # 客户端
│   └── shared/schema.ts          # 表结构定义
└── lib/utils.ts                  # 工具函数
```

## 核心功能

1. **导航**: 个人简介 → 通知公告 → 信息公开 → 服务大厅
2. **认证**: 普通用户(手机号+密码,7天Cookie) / 管理员(环境变量配置,会话级)
3. **服务大厅**: 在线咨询、信息申请公开、财务管理（需登录）
4. **管理员后台**: 用户管理、咨询/申请管理、借据台账、内容管理
5. **全局搜索**: 检索通知公告、信息公开、咨询、借据
6. **深浅色主题**: 支持切换

## 环境变量

- `ADMIN_USERNAME` - 管理员用户名
- `ADMIN_PASSWORD` - 管理员密码

## 数据库表

- `users` - 用户表
- `notices` - 通知公告
- `info_disclosures` - 信息公开
- `consultations` - 在线咨询
- `disclosure_requests` - 信息申请
- `ious` - 借据
- `verification_records` - 核验记录
- `feedback` - 访客反馈
- `visit_stats` - 访问统计
- `audit_logs` - 操作日志
- `site_settings` - 网站设置

## 构建命令

```bash
pnpm install        # 安装依赖
pnpm run dev        # 开发模式
pnpm run build      # 生产构建
pnpm run start      # 生产启动
```

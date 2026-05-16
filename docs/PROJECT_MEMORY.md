# Project Memory

本文档是本项目的长期交接记忆。它记录当前状态、稳定决策、验证结果和下一步。不要把完整聊天记录粘贴到这里，只记录未来 AI 和另一台电脑需要知道的事实。

## Project Identity

Capstone Cognitive Training Platform 是一个认知训练与评估平台。它包含训练游戏、基线评估、数据分析、历史记录、排行榜、用户资料和管理页面。

当前目标不是重写项目，而是保护已成型版本，逐步完成：

- Git 和双电脑同步。
- AI 协作文档。
- MySQL 数据说明。
- 轻量 UI 统一。
- 文件和交付材料整理。
- 未来作为个人网站项目页的准备。

## Current Repository State

本项目 Git 仓库路径：

```text
/Users/mac/Desktop/Capstone Project/cognitive-training-platform-hi-main
```

GitHub 私有仓库：

```text
https://github.com/CharlieChan-hi/capstone-cognitive-training-platform.git
```

初始稳定快照已创建并推送到 `origin/main`。

## Current Stack

- React 19 + Vite
- TypeScript
- Express
- tRPC
- Drizzle ORM
- MySQL / TiDB 兼容连接
- Vitest
- Tailwind CSS 4
- Radix UI / shadcn 风格组件
- Recharts
- wouter

## Current Source Of Truth

AI 进入项目后应优先读取：

1. `AGENTS.md`
2. `README.md`
3. `DESIGN.md`
4. `docs/PROJECT_MEMORY.md`
5. `docs/RISK_REGISTER.md`
6. `docs/ARCHITECTURE.md`
7. `docs/DATA_AND_MYSQL.md`
8. `docs/GIT_WORKFLOW.md`
9. `docs/SECURITY.md`

视觉参考：

- `DESIGN.md`
- `apple/DESIGN.md`
- `client/src/index.css`

测试参考：

- `TESTING.md`
- `server/training.test.ts`
- `server/auth.logout.test.ts`

## Current Validation Baseline

Git 初始化和首次推送前，以下验证已通过：

```text
corepack pnpm check
corepack pnpm test
corepack pnpm build
```

构建时曾出现 Vite bundle 偏大的警告，但构建通过。该警告记录在 `docs/RISK_REGISTER.md`，不是当前 blocker。

本地预览入口是 `/`。当前路由树没有 `/login`，直接访问 `/login` 会显示项目自己的 404 页面。

## Current Local Data Baseline

2026-05-09 已将外层标准源 `AI读取_完整同步数据_2026-05-07/sync_full_2026-01-18_to_2026-04-26.sql` 导入本机 `.env` 指向的本地 MySQL 数据库 `localhost:3306/cognitive_training`。

导入后的标准同步包计数：users 1、training_sessions 98、trial_data 2544、baseline_assessments 0、assessment_tasks 0、data_quality_flags 0。

2026-05-09 本机当前活库包含后续本地测试记录：training_sessions 100、trial_data 2563、日期范围 2026-01-18 至 2026-05-09。其中 2 条 session 已通过 `includedInStats` 软排除，4 条为未完成 session。Dashboard 日历按已完成或有结果且未排除的 session 显示，当前可显示 94 条统计 session。

## Important Decisions

- `/Users/mac/Desktop/charliechanstudio.com` 只读参考，不在本轮修改。
- 论文已经提交，不修改论文正文。
- 外层 `05_项目数据与数据库备份/AI读取_完整同步数据_2026-05-07` 是当前 MySQL 数据标准源，不随意改导出文件。
- UI 只做轻量统一，不做大改。
- 大文件如 `Dashboard.tsx`、`Analytics.tsx`、`ComponentShowcase.tsx`、游戏和评估页面暂不做结构性重构。
- 删除文件必须谨慎，先确认用途和用户意图。

## Next Actions

建议顺序：

1. 完成治理文档和数据说明。
2. 同步外层 MySQL README 的入口说明。
3. 梳理根目录松散文档，把长期信息迁移到 `docs/`，先不删除原文件。
4. 再做轻量 UI polish。
5. 每批修改后运行验证并审查 diff。

## Governance Documentation Map

This project now follows the reference site's governance pattern without copying its code or directory layout.

- `DESIGN.md`：design entrypoint for this app.
- `docs/CONTENT.md`：portfolio/project story and screenshot preparation.
- `docs/DEPLOYMENT.md`：local preview, build, and future hosting boundaries.
- `docs/IMPORT_AND_DECOMPOSE.md`：future personal-site embedding preparation.
- `docs/SECURITY.md`：secret, database, data export, and public demo safety.

Reference site `/Users/mac/Desktop/charliechanstudio.com` remains read-only. Current app code stays in this independent repository until a separate embedding plan is approved.

## Legacy Notes Index

以下根目录文档先保留，不删除、不移动。后续整理时应先读取内容，再把仍有效的信息迁移到 `docs/PROJECT_MEMORY.md` 或 `docs/RISK_REGISTER.md`。

- `ideas.md`：早期设计头脑风暴，包含 Swiss / clinical research 风格方向。
- `todo.md`：较早的全面升级计划，部分条目可能已过期。
- `UPGRADE_TODO.md`：系统升级清单，含已完成和未完成功能项。
- `URGENT_FIXES.md`：早期紧急修复列表，需要逐项核对现状后再决定是否仍有效。
- `session-memory-2026-03-25.md`：早期项目全记录，包含已修复 bug、架构和学术指标背景。
- `apple/README.md`：Apple inspired design system 的来源说明。

当前 source of truth 是 `AGENTS.md`、`README.md` 和 `docs/` 下的维护文档。旧笔记只作为历史参考。

## 2026-05-09 Documentation Sync

外层 `README_先读我.md`、`05_项目数据与数据库备份/.../README_先读我.md`、`07_答辩演示_HTML/docs/` 和 `08_答辩问答与代码拆解/` 已同步当前项目口径。

答辩材料要区分两种数据口径：

- 稳定同步包：98 sessions / 2544 trials / 2026-01-18 至 2026-04-26。
- 本机活库：100 sessions / 2563 trials / 2026-01-18 至 2026-05-09，含 2 条软排除和 4 条未完成 session。

论文正文目录 `01_论文材料/` 未在本次同步中修改。

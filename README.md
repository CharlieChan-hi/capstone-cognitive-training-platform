# Capstone Cognitive Training Platform

这是一个认知训练与评估平台，用于毕业项目展示、训练数据记录、基线评估和研究式数据分析。项目已经进入稳定整理阶段，后续优化以文档治理、轻量 UI 统一、数据说明和交付材料同步为主。

## Quick Start

```bash
corepack pnpm install
corepack pnpm dev
```

默认开发服务会从 `server/_core/index.ts` 启动，并寻找可用端口。本地公开入口是 `/`；当前没有 `/login` 路由。

常用验证命令：

```bash
corepack pnpm check
corepack pnpm test
corepack pnpm build
```

如果本机没有启用 `pnpm`，优先使用 `corepack pnpm`，不要改锁文件来绕过问题。

## Stack

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

## Project Structure

```text
client/       React 前端页面、组件、样式和浏览器逻辑
server/       Express、tRPC、OAuth、服务端 API 和数据库访问
shared/       前后端共享常量和类型
drizzle/      MySQL schema、迁移和快照
docs/         架构、数据、风险、Git 和 AI 协作文档
apple/        设计系统参考
scripts/      数据生成或维护脚本
```

更多结构说明见 `docs/ARCHITECTURE.md`。

## Documentation Map

AI 和协作者应先读：

1. `AGENTS.md`
2. `README.md`
3. `DESIGN.md`
4. `docs/PROJECT_MEMORY.md`
5. `docs/RISK_REGISTER.md`
6. `docs/ARCHITECTURE.md`
7. `docs/DATA_AND_MYSQL.md`
8. `docs/GIT_WORKFLOW.md`

项目治理文档：

- `DESIGN.md`：本项目设计入口和 Apple-inspired UI 边界。
- `apple/DESIGN.md`：更完整的 Apple Design 视觉参考。
- `docs/CONTENT.md`：未来展示、文案、截图和个人网站嵌入内容边界。
- `docs/DEPLOYMENT.md`：本地预览、构建和未来部署边界。
- `docs/IMPORT_AND_DECOMPOSE.md`：未来拆解为个人网站项目页的准备规则。
- `docs/SECURITY.md`：密钥、数据库、数据导出和公开 demo 安全边界。
- `TESTING.md`：测试策略。
- `local_setup_guide.md`：本地环境和数据库设置。

## Data And MySQL

本项目运行依赖 `.env` 中的 `DATABASE_URL`。真实 `.env` 不提交 Git。

外层数据备份入口：

```text
/Users/mac/Desktop/Capstone Project/05_项目数据与数据库备份/AI读取_完整同步数据_2026-05-07/README_先读我.md
```

主项目中的数据库说明见 `docs/DATA_AND_MYSQL.md`。

## Git And Two Computers

本项目已连接 GitHub 私有仓库：

```text
https://github.com/CharlieChan-hi/capstone-cognitive-training-platform.git
```

日常流程：

```bash
git pull
git status
git add <files>
git commit -m "说明这次改了什么"
git push
```

第二台电脑建议用 `git clone` 获取项目，不要依赖 Cloud 同步 `.git` 目录。

## Stability Rule

项目已经基本成型。后续修改必须小步、可验证、可回退。宁可少改，也不要为了整理或视觉优化引入 bug。

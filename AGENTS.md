# Capstone Cognitive Training Platform Agent Rules

这个文件是 AI agent 和协作者进入本项目后的第一份规则。目标是保护已经成型的毕业项目，让后续优化稳定、小步、可验证。

## Start Here

每次开始修改前，先阅读：

1. `AGENTS.md`：协作规则和边界。
2. `README.md`：项目用途、启动方式和脚本。
3. `DESIGN.md`：本项目设计入口和 Apple-inspired UI 边界。
4. `docs/ARCHITECTURE.md`：当前结构和数据流。
5. `docs/PROJECT_MEMORY.md`：当前状态、已完成事项和下一步。
6. `docs/RISK_REGISTER.md`：风险和延期项。
7. `docs/GIT_WORKFLOW.md`：Git 与双电脑同步规则。
8. `docs/SECURITY.md`：密钥、数据库和公开 demo 安全边界。

如果任务涉及数据库或外层资料，再阅读：

- `docs/DATA_AND_MYSQL.md`
- `local_setup_guide.md`
- `/Users/mac/Desktop/Capstone Project/05_项目数据与数据库备份/AI读取_完整同步数据_2026-05-07/README_先读我.md`

如果任务涉及视觉统一，再阅读：

- `DESIGN.md`
- `apple/DESIGN.md`
- `client/src/index.css`

## Project Intent

这是一个认知训练与评估平台，用于展示训练游戏、基线评估、数据分析、用户历史和研究式指标。项目已经基本成型，后续工作以稳定维护、文档治理、轻量 UI 统一和交付整理为主。

优先级从高到低：

1. 不引入 bug。
2. 保持现有功能和数据逻辑稳定。
3. 小步改动，每批可验证。
4. 让未来 AI 和另一台电脑能稳定接手。
5. 在不大改的前提下优化体验和文档。

## Hard Boundaries

禁止：

- 修改 `/Users/mac/Desktop/charliechanstudio.com`，它只作为参考。
- 修改论文正文或已提交论文稿件。
- 删除 `.csv`、`.xlsx` 文件。
- 删除任何 `Temp` 目录内容。
- 提交 `.env`、本地数据库、`node_modules`、`dist`、日志、`.manus`。
- 大范围重写路由、认证、数据库 schema、游戏机制或评估算法。
- 为了“整理”直接删除看不懂的旧文件。
- 在长期信息迁移前删除 `ideas.md`、`todo.md`、`UPGRADE_TODO.md`、`URGENT_FIXES.md`、`session-memory-2026-03-25.md` 等 legacy notes。

如果要删除文件，必须先确认它不是数据、论文、导出、历史交接或用户仍可能需要的材料。

## File Ownership

- `client/`：React 前端页面、组件、样式、浏览器交互。
- `server/`：Express、tRPC、OAuth、服务端能力。
- `shared/`：前后端共享常量和类型。
- `drizzle/`：MySQL schema 和迁移快照。
- `docs/`：长期维护文档、架构、风险、数据说明、Git 流程。
- `apple/`：设计系统参考，不是业务代码。
- `scripts/`：数据生成或维护脚本。
- 外层 `05_项目数据与数据库备份/`：MySQL 导出和跨电脑数据材料，不属于主 Git 仓库。

根目录只放项目入口、配置和必要交接文档。新增长期说明优先放入 `docs/`。

## Development Workflow

每批修改前：

```bash
git status --short --branch
```

修改原则：

- 一批只做一类事情，例如文档、UI、数据库说明分开。
- 优先沿用已有组件和样式 token。
- 先理解调用链，再改代码。
- 大文件只做局部修复，不顺手重构。

修改后按影响范围验证：

```bash
corepack pnpm check
corepack pnpm test
corepack pnpm build
```

文档-only 改动至少运行 `corepack pnpm check`，确认项目仍能类型检查。

## UI Rules

UI 只做轻量统一，不做重新设计。优先检查：

- `client/src/index.css`
- `client/src/pages/Home.tsx`
- `client/src/pages/Login.tsx`
- `client/src/components/DashboardLayout.tsx`
- `client/src/components/PageHeader.tsx`

不要把项目改成通用 SaaS 模板。保持认知训练、研究仪表盘和毕业项目展示的定位。

## Data And Secrets

真实数据库连接只允许存在于本机 `.env`。文档中只能写变量名、占位符或本地示例，不写真实密码、token 或远程凭据。

外层 MySQL 导出目录用于同步数据和 AI 读取，不要随意移动、删除或改写导出文件。

## Git Rules

本项目远程仓库：

```text
https://github.com/CharlieChan-hi/capstone-cognitive-training-platform.git
```

工作开始前 `git pull`，工作结束后按需 `git status`、`git add`、`git commit`、`git push`。不要在用户未要求时自动提交或推送。

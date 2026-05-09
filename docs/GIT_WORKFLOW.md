# Git 工作流与双电脑同步说明

这份文档用于记录本项目的 Git 使用方式。目标是让你和后续 AI 都能稳定协作，先保护当前已经成型的项目，再逐步做 UI、代码和文档优化。

## 1. Git 是什么

Git 可以理解成项目的安全快照系统。项目初始化 Git 之后，文件夹里会出现一个隐藏目录 `.git/`，它记录项目历史、当前分支、每个文件的改动状态，以及每一次提交。

常用概念：

- `git status`，查看哪些文件新增、修改或删除。
- `git add`，把准备保存的文件放进暂存区。
- `git commit`，保存一个稳定快照。
- `git pull`，从远程仓库拉取另一台电脑或远程上的最新版本。
- `git push`，把本机提交推送到远程仓库。

## 2. 本项目推荐同步方式

本项目建议使用本地 Git 加 GitHub 私有仓库同步，不建议依赖 Desktop Cloud 直接同步 `.git/`。

推荐流程：

```text
电脑 A 修改项目
电脑 A git commit
电脑 A git push
GitHub 私有仓库保存最新版本
电脑 B git pull 或 git clone
电脑 B 继续修改
```

原因：Cloud 同步普通文件可以，但 `.git/` 里有很多 Git 内部状态文件。如果 Cloud 在 Git 提交过程中同步，容易出现冲突副本、锁文件或历史状态不一致。GitHub 私有仓库更适合作为两台电脑之间的稳定中转站。

## 3. 首次初始化流程

首次只在主项目目录执行：

```bash
cd "/Users/mac/Desktop/Capstone Project/cognitive-training-platform-hi-main"
git init
git status
```

确认 `.gitignore` 已经忽略这些内容：

- `.env`
- `.env.local`
- `node_modules`
- `.DS_Store`
- `dist/`
- `build/`
- `*.log`
- `*.db`
- `*.sqlite`
- `*.sqlite3`

确认安全后再建立初始快照：

```bash
git add .
git status
git commit -m "Initial stable project snapshot"
```

提交前一定要检查 `git status`。如果看到 `.env`、`node_modules`、本地数据库、构建产物或 Cloud 冲突文件，不要提交。

## 4. GitHub 私有仓库同步

你需要先在 GitHub 创建一个 private repository。仓库创建好后，把仓库地址交给 Claude 或自己执行：

```bash
git remote add origin <你的私有仓库地址>
git branch -M main
git push -u origin main
```

第二台电脑建议使用：

```bash
git clone <你的私有仓库地址>
```

如果第二台电脑已经通过 Cloud 同步了一份同名文件夹，不要直接乱 pull 或覆盖。先确认两边文件状态，再决定是删除 Cloud 副本后 clone，还是迁移现有副本。

## 5. 日常双电脑工作规则

每次开始工作前：

```bash
git pull
```

每次结束工作后：

```bash
git status
git add <本次需要保存的文件>
git commit -m "简短说明这次改了什么"
git push
```

建议每次只提交一类改动，例如：

- 文档更新单独提交。
- UI 润色单独提交。
- 数据库或 MySQL 文档更新单独提交。
- 文件清理单独提交。

这样如果以后出现 bug，可以更容易定位是哪一次改动造成的。

## 6. 敏感文件规则

`.env` 不提交到 Git。里面可能有数据库地址、密码、token 或其他密钥。

如果第二台电脑也需要运行项目，后续可以新增 `.env.example`，只写变量名，不写真实值，例如：

```env
DATABASE_URL=
SESSION_SECRET=
```

真实 `.env` 由每台电脑自己保存。

## 7. Claude 和 AI 协作规则

以后让 AI 修改这个项目时，建议遵守：

1. 修改前先运行 `git status`。
2. 不在有未确认改动时做大范围重构。
3. UI、代码、文档、数据库说明分批修改。
4. 每一批修改后运行必要验证。
5. 验证失败时不要提交“看似完成”的代码。
6. 不提交 `.env`、`node_modules`、构建产物、本地数据库、Cloud 冲突副本。

## 8. 推荐验证命令

本项目常用验证命令来自 `package.json`：

```bash
pnpm check
pnpm test
pnpm build
```

在重要提交前，至少运行 `pnpm check`。如果改到业务逻辑、数据库、路由或 UI 组件，建议再运行 `pnpm test` 和 `pnpm build`。

## 9. 当前项目边界

本 Git 仓库只管理：

```text
/Users/mac/Desktop/Capstone Project/cognitive-training-platform-hi-main
```

不管理：

- `/Users/mac/Desktop/charliechanstudio.com`，只作为参考。
- `/Users/mac/Desktop/Capstone Project/01_论文材料`，论文已经提交，不在本轮更新范围。
- `/Users/mac/Desktop/Capstone Project/05_项目数据与数据库备份`，除非后续明确需要同步数据库说明或待更新清单。

## 10. 最重要的习惯

开始前：

```bash
git pull
```

结束后：

```bash
git status
git add <文件>
git commit -m "说明"
git push
```

如果不确定，就先运行：

```bash
git status
```

把输出给 Claude 看，再决定下一步。

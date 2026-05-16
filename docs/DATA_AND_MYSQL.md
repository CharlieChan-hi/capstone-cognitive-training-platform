# Data And MySQL

本文档说明主项目和 MySQL 数据材料的关系。它不保存真实数据库密码、token 或远程连接信息。

## Runtime Database

项目运行时通过 `.env` 中的 `DATABASE_URL` 连接 MySQL 或 TiDB 兼容数据库。

示例格式：

```env
DATABASE_URL=mysql://<user>:<password>@<host>:<port>/<database>
```

真实 `.env` 不提交 Git。第二台电脑需要单独配置自己的 `.env`。

## Schema Source

数据库 schema 和迁移相关文件在主项目内：

```text
drizzle/schema.ts
drizzle/*.sql
drizzle/meta/*.json
drizzle.config.ts
```

常用迁移命令：

```bash
corepack pnpm db:push
```

执行数据库迁移前必须确认目标数据库和 `.env`，不要对未知远程数据库运行迁移。

## Application Data Flow

高层数据路径：

```text
client pages/components
  -> client/src/lib/trpc.ts
  -> server/routers.ts
  -> server/db.ts
  -> MySQL tables from drizzle/schema.ts
```

训练和评估相关数据主要由服务端路由和数据库层处理。不要在前端直接写真实数据库连接或 secret。

## Outer Data Backup Folder

当前完整 MySQL 同步数据入口在主项目外：

```text
/Users/mac/Desktop/Capstone Project/05_项目数据与数据库备份/AI读取_完整同步数据_2026-05-07/README_先读我.md
```

该目录当前包含：

- `manifest.json`
- `training_sessions_full.json/csv`
- `trial_data_full.json/csv`
- `users.json/csv`
- `summary_by_date_game.csv`
- `summary_by_month_game.csv`
- `sync_full_2026-01-18_to_2026-04-26.sql`

现有数据说明记录（2026-05-07 标准同步包）：

- 导出时间：2026-05-07T14:32:21.730Z
- Asia/Shanghai 日期范围：2026-01-18 至 2026-04-26
- users：1
- training_sessions：98
- trial_data：2544
- baseline_assessments：0
- assessment_tasks：0
- data_quality_flags：0
- 按游戏 session 数：gonogo 19、memory 29、schulte 20、stroop 30

SQL 导入脚本只包含 `users`、`training_sessions`、`trial_data` 的 upsert；当前检查未发现 `DROP TABLE`、`TRUNCATE`、`DELETE FROM`、`ALTER TABLE` 或 `CREATE TABLE`。

## Import On Another Computer

另一台电脑导入数据前建议顺序：

1. `git clone` 项目。
2. 安装依赖。
3. 配置 `.env`。
4. 确认数据库 schema 已迁移。
5. 确认 `.env` 指向目标本地数据库，不是未知远程数据库。
6. 再按外层 README 导入 SQL。

外层 README 当前建议命令：

```bash
mysql -h <host> -P <port> -u <user> -p <database> < sync_full_2026-01-18_to_2026-04-26.sql
```

导入脚本使用 `ON DUPLICATE KEY UPDATE`，同 ID 数据会更新。

## Safety Rules

- 不把真实 `DATABASE_URL` 写进文档。
- 不提交 `.env`。
- 不删除或重命名外层 CSV、JSON、SQL 数据导出。
- 不在未确认目标数据库时运行迁移或导入。
- 数据文档更新优先写说明和路径，不复制大段数据。

## Current Local Live Database

2026-05-09 本机 `.env` 指向的当前活库为 `localhost:3306/cognitive_training`。该活库是在 2026-05-07 标准同步包基础上继续本地测试后的状态：

- users：1
- training_sessions：100
- trial_data：2563
- baseline_assessments：0
- assessment_tasks：0
- data_quality_flags：0
- 日期范围：2026-01-18 至 2026-05-09
- 已软排除 session：2
- 未完成 session：4
- Dashboard 日历统计 session：94

标准同步包文件仍保持 98 sessions / 2544 trials。不要直接改外层导出文件；如需新的跨电脑标准源，应重新导出到新的日期目录。

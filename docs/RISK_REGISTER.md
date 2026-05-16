# Risk Register

本文件记录当前项目风险、影响和处理策略。风险不等于 bug，目的是让后续 AI 不要重复踩坑或误判优先级。

## Open Risks

### R1. Bundle size warning

- **Status:** Open
- **Area:** Frontend build
- **Observation:** `corepack pnpm build` 通过，但 Vite 提示部分 chunk 超过 500 kB。
- **Impact:** 当前不是功能 blocker，但未来加载性能可能受影响。
- **Mitigation:** 暂不在第一轮处理。后续如优化性能，再考虑 route-level lazy loading、manual chunks 或拆分大型页面。

### R2. Large page files

- **Status:** Open
- **Area:** Frontend maintainability
- **Observation:** `Dashboard.tsx`、`Analytics.tsx`、`ComponentShowcase.tsx`、多个游戏和评估页面较大。
- **Impact:** 大范围重构容易引入 bug。
- **Mitigation:** 首轮只做局部 UI polish 和文档治理，不做结构性拆分。未来拆分必须逐页、带验证。

### R3. Local MySQL and cross-computer data sync

- **Status:** Open
- **Area:** Database / handoff
- **Observation:** 外层 `05_项目数据与数据库备份` 保存 MySQL 导出。`.env` 中真实连接不提交 Git。
- **Impact:** 第二台电脑运行项目时需要独立配置数据库和导入数据。
- **Mitigation:** 使用 `docs/DATA_AND_MYSQL.md` 和外层 `README_先读我.md` 作为入口。不要把凭据写入文档。

### R4. OAuth and environment configuration

- **Status:** Open
- **Area:** Auth / local setup
- **Observation:** 本地运行依赖 OAuth 和环境变量。缺少配置时会出现提示或登录不可用。
- **Impact:** 新电脑或新 AI 可能误判为代码 bug。
- **Mitigation:** 通过 `local_setup_guide.md` 和 `.env.example` 形式说明变量名，不写真实值。

### R5. Future personal-site embedding

- **Status:** Deferred
- **Area:** Portfolio integration
- **Observation:** 未来可能嵌入 `charliechanstudio.com` 作为项目二级页面。
- **Impact:** 如果现在过早搬移代码，会增加部署和路径风险。
- **Mitigation:** 当前只准备 README/架构说明、slug、截图和内容要求，不修改参考网站。

### R6. Loose legacy notes in project root

- **Status:** Open
- **Area:** Documentation hygiene
- **Observation:** 根目录存在 `ideas.md`、`todo.md`、`UPGRADE_TODO.md`、`URGENT_FIXES.md`、`session-memory-2026-03-25.md` 等松散文档。
- **Impact:** 后续 AI 可能不知道哪些是当前 source of truth。
- **Mitigation:** 第一轮先建立 `docs/PROJECT_MEMORY.md` 和本风险登记。后续读取内容后迁移长期信息，再决定是否归档或删除。


### R7. Legacy notes may contain stale tasks

- **Status:** Open
- **Area:** Documentation hygiene / planning
- **Observation:** `ideas.md`、`todo.md`、`UPGRADE_TODO.md`、`URGENT_FIXES.md`、`session-memory-2026-03-25.md` contain useful history but may not reflect current implementation state.
- **Impact:** Future AI may treat stale tasks as current requirements.
- **Mitigation:** `docs/PROJECT_MEMORY.md` now indexes these as legacy notes. Before acting on any item, verify current code and tests. Do not delete them until their durable content has been migrated or the user approves deletion.


### R8. Invalid `/login` preview path

- **Status:** Open
- **Area:** Frontend routing / validation
- **Observation:** `client/src/App.tsx` exposes `/` as the public entry. There is no `/login` route, so direct `/login` preview shows the app's 404 page.
- **Impact:** Future AI may misread a correct 404 as a broken login page.
- **Mitigation:** Use `/` for local preview and smoke checks. Only add a `/login` route if product requirements explicitly change.

### R9. Local data import can update existing rows

- **Status:** Reduced
- **Area:** Database / local setup
- **Observation:** The canonical SQL export uses `ON DUPLICATE KEY UPDATE` for `users`、`training_sessions`、`trial_data`.
- **Impact:** Importing into the wrong database can overwrite rows with matching IDs.
- **Mitigation:** 2026-05-09 已确认本机 `.env` 指向 `localhost:3306/cognitive_training` 后导入，计数与 manifest 匹配。未来换电脑或换 `.env` 时仍必须重新确认目标库，不能直接沿用本次结论。



### R10. Over-copying reference-site structure

- **Status:** Open
- **Area:** Documentation hygiene / future embedding
- **Observation:** `charliechanstudio.com` has a mature governance structure, but this app has different runtime, database, auth, and testing needs.
- **Impact:** Blindly copying folders or docs could create redundant, misleading, or stale instructions.
- **Mitigation:** Use reference-site docs as a pattern only. Keep project-specific docs such as `DATA_AND_MYSQL.md`、`GIT_WORKFLOW.md`、`TESTING.md`, and do not move the runnable app into the website without a separate plan.

### R11. Sidebar collapse animation flicker

- **Status:** Open
- **Area:** Frontend UI stability
- **Observation:** `DashboardLayout.tsx` originally mixed manual main-width locking with grid and label transitions. A later simplification removed the grid transition and made collapse/expand feel abrupt.
- **Impact:** Sidebar collapse/expand can feel unsmooth or cause chart/content resize distraction on desktop routes.
- **Mitigation:** 2026-05-09 reintroduced a single CSS-driven sidebar/grid width transition with staggered label opacity/transform and no manual width measurement. Validate visually by toggling the sidebar in `/app/dashboard` and `/app/games` preview.


### R12. Anomalous sessions can distort analytics charts

- **Status:** Reduced
- **Area:** Analytics / local data quality
- **Observation:** A single isolated session with unusually high reaction time can stretch histogram/scatter axes and create large empty chart areas.
- **Impact:** Users may misread the current training pattern, especially when recent local test data is not representative.
- **Mitigation:** 2026-05-09 added user-facing soft exclusion through `includedInStats` and visual-only RT outlier guards in analytics. Do not physically delete MySQL training rows for this UI cleanup.

### R13. Data generation script can overwrite local training rows

- **Status:** Reduced
- **Area:** Database / scripts
- **Observation:** `scripts/generate-fake-data.ts` can delete existing `training_sessions` and `trial_data` for the configured user before generating mock data.
- **Impact:** Accidentally running the script against the active local database can replace real imported training history.
- **Mitigation:** 2026-05-09 changed cleanup to opt-in through `CLEAR_OLD_TRAINING_DATA=true`. Keep the default non-destructive, and confirm `DATABASE_URL` before any data generation.

### R14. Assessment results are still local-first

- **Status:** Open
- **Area:** Assessment / persistence
- **Observation:** Baseline assessment pages compute results and pass them through the current local flow; backend persistence is still marked as TODO.
- **Impact:** Users may expect assessment results to sync like training sessions, but current persistence is not the same data path.
- **Mitigation:** Do not treat this as a silent bug fix. If assessment sync becomes a requirement, implement it as a separate feature with schema/API review and tests.

### R15. Historical Drizzle migration contains destructive statements

- **Status:** Open
- **Area:** Database / migrations
- **Observation:** `drizzle/0005_friendly_bloodscream.sql` contains `DROP TABLE` statements for older assessment tables.
- **Impact:** Running migrations against an unknown or valuable database can remove tables if the migration history is not already applied.
- **Mitigation:** Before `corepack pnpm db:push` or migration execution, confirm the target database and migration state. Do not run migrations on an unknown remote database.

### R16. Chart CSS injection is controlled but should stay internal

- **Status:** Reduced
- **Area:** Frontend / chart rendering
- **Observation:** `client/src/components/ui/chart.tsx` uses `dangerouslySetInnerHTML` to inject scoped CSS variables for Recharts themes.
- **Impact:** This is acceptable only while chart config values remain developer-controlled; user-controlled color strings would create avoidable injection risk.
- **Mitigation:** Keep chart config internal/static. Do not pass raw user input into chart theme or color config.

## Closed Or Reduced Risks

### C1. No Git baseline

- **Status:** Reduced
- **Resolution:** 本地 Git 已初始化，初始稳定快照已推送到 GitHub 私有仓库。

### C2. Sensitive local files accidentally committed

- **Status:** Reduced
- **Resolution:** `.gitignore` 已覆盖 `.env`、`.manus/`、`node_modules/`、`dist/`、日志、本地数据库文件等。提交前已排除 `.manus` 数据库查询记录。

## Review Rule

每次关闭或降低一个风险时，更新本文件。不要把风险藏在聊天记录里。

### R17. Calendar display depends on query range and session filtering

- **Status:** Reduced
- **Area:** Dashboard / data display
- **Observation:** Dashboard calendar originally queried only 50 sessions and generated a 90-day data window while the UI displayed 22 weeks. Imported data from 2026-01-18 onward could appear missing.
- **Impact:** Users may think MySQL data was not imported even when the database contains the records.
- **Mitigation:** 2026-05-09 updated Dashboard to query up to 1000 sessions and generate calendar data for the same 22-week window used by the component. Calendar still intentionally excludes soft-excluded and incomplete sessions.

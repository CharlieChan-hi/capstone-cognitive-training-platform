# Charlie's FocusLab 系统升级清单

## Phase 1: 数据写入修复
- [x] 数据库schema添加score和accuracy字段
- [x] server/routers.ts添加score和accuracy到completeSession
- [x] SchulteGame修复useAuth导入和数据写入
- [ ] MemoryGame添加score和accuracy计算与写入
- [ ] GoNoGoGame添加score和accuracy计算与写入
- [ ] StroopGame添加score和accuracy计算与写入

## Phase 2: Dashboard真实数据图表
- [ ] 检查当前Dashboard图表实现
- [ ] 添加Mock数据生成函数
- [ ] 实现无数据时显示Mock图表+提示
- [ ] 实现有数据时显示真实图表

## Phase 3: Analytics真实数据图表
- [ ] 检查当前Analytics图表实现
- [ ] 添加Mock数据生成函数
- [ ] 实现无数据时显示Mock图表+提示
- [ ] 实现有数据时显示真实图表

## Phase 4: Admin导出功能
- [ ] 创建导出API endpoint（CSV格式）
- [ ] 创建导出API endpoint（JSON格式）
- [ ] Admin页面添加导出按钮
- [ ] 实现权限校验（仅admin可导出）

## Phase 5: 用户Profile页面
- [ ] 创建Profile页面组件
- [ ] 实现名字修改功能
- [ ] 实现头像上传功能（S3）
- [ ] 添加路由和导航

## Phase 6: UI统一
- [ ] 修复Stroop游戏深色背景为浅色
- [ ] 统一全站配色tokens
- [ ] 检查所有游戏视觉一致性

## Phase 7: 品牌清理
- [ ] 全站搜索删除"manus/meta/PowerBI"残留
- [ ] 确认favicon为简约大脑图标
- [ ] 确认网站标题为"Charlie's FocusLab"
- [ ] 确认导航命名规范

## Phase 8: 最终测试
- [ ] 测试完整游戏流程（4个游戏）
- [ ] 测试数据写入和图表显示
- [ ] 测试Admin导出功能
- [ ] 测试Profile修改功能
- [ ] 保存最终检查点


## 用户反馈的新需求（2026-01-11）
- [ ] 使用图3的简洁logo（左边的大脑图标）
- [ ] 删除"严肃训练"等不符合用户认知的文案
- [ ] 修复数据分析页面显示"暂无数据"的问题
- [ ] 实现Admin数据导出功能
- [ ] 实现用户Profile页面（修改姓名和上传头像）
- [ ] 优化整体用户流程


## 用户新需求（2026-01-11 Phase 2）
- [ ] 为舒尔特方格添加点击成功/失败的动效反馈
- [ ] 统一所有游戏界面为清晰的浅色主题（移除暗色背景）


## 用户新需求（2026-01-11 Phase 3）
- [x] 为SchulteGame结果页添加详细分析报告（图表+文字）
- [ ] 为MemoryGame结果页添加详细分析报告（图表+文字）
- [ ] 为GoNoGoGame结果页添加详细分析报告（图表+文字）
- [ ] 为StroopGame结果页添加详细分析报告（图表+文字）


## 用户新需求（2026-01-11 Phase 4）
- [ ] 创建Profile页面组件
- [ ] 实现显示名称修改功能
- [ ] 实现头像上传功能（S3存储）
- [ ] 添加Profile入口到导航菜单
- [ ] 更新数据库schema添加displayName和avatarUrl字段

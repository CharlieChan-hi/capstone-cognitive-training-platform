import type { ReactNode } from "react";

/**
 * 全站统一页面标题栏 — 与侧栏 Logo 区严格对齐
 *
 * UI 标注参数（全站一套，不可随意改动）:
 * ─────────────────────────────────────────────────
 * 容器高度 : h-16 (64px) 固定，与侧栏 Logo 区 h-16 严格一致
 * 分割线   : border-b border-border（同侧栏，贯穿全页宽度）
 * 标题     : text-lg (18px) / font-semibold / tracking-tight / text-foreground
 * 副标题   : text-xs (12px) / text-muted-foreground
 * 水平边距 : -mx-4 lg:-mx-6 + px-4 lg:px-6（撑满主内容区宽度）
 * 定位     : sticky top-0 z-20 / bg-background
 * ─────────────────────────────────────────────────
 */

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  badge?: ReactNode;
}

export function PageHeader({ title, description, actions, badge }: PageHeaderProps) {
  return (
    <div
      className="sticky top-0 z-20 bg-background -mx-4 lg:-mx-6 px-4 lg:px-6 border-b border-border mb-4"
      style={{ height: 64 }}
    >
      <div className="h-full flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-foreground leading-none">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-normal truncate">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

import { format, startOfWeek, addDays, subDays } from 'date-fns';
import { useState, useMemo } from 'react';

interface TrainingCalendarProps {
  data: Record<string, number>; // { 'yyyy-MM-dd': count }
  language: 'zh' | 'en';
}

export function TrainingCalendar({ data, language }: TrainingCalendarProps) {
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted/50';
    if (count === 1) return 'bg-emerald-200 dark:bg-emerald-900/80';
    if (count === 2) return 'bg-emerald-300 dark:bg-emerald-700/80';
    if (count === 3) return 'bg-emerald-400 dark:bg-emerald-600/80';
    if (count === 4) return 'bg-emerald-500 dark:bg-emerald-500';
    return 'bg-emerald-600 dark:bg-emerald-400';
  };

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const numWeeks = 13;
    const weeksData: { date: Date; count: number }[][] = [];

    // Start from numWeeks weeks ago, aligned to Sunday
    let currentDate = startOfWeek(subDays(today, (numWeeks - 1) * 7), { weekStartsOn: 0 });

    for (let week = 0; week < numWeeks; week++) {
      const weekData: { date: Date; count: number }[] = [];
      for (let day = 0; day < 7; day++) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        weekData.push({ date: new Date(currentDate), count: data[dateStr] || 0 });
        currentDate = addDays(currentDate, 1);
      }
      weeksData.push(weekData);
    }

    // Generate month labels with correct column positions
    // Skip labels that would overlap (need at least 3 columns apart)
    const labels: { month: string; colStart: number }[] = [];
    let lastMonth = -1;
    let lastLabelCol = -3;
    weeksData.forEach((week, index) => {
      const month = week[0].date.getMonth();
      if (month !== lastMonth) {
        // Only add label if far enough from last one to avoid overlap
        if (index - lastLabelCol >= 3) {
          labels.push({
            month: format(week[0].date, language === 'zh' ? 'M月' : 'MMM'),
            colStart: index,
          });
          lastLabelCol = index;
        }
        lastMonth = month;
      }
    });

    return { weeks: weeksData, monthLabels: labels };
  }, [data, language]);

  const dayLabels = language === 'zh'
    ? ['', '一', '', '三', '', '五', '']
    : ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  const totalSessions = Object.values(data).reduce((sum, v) => sum + v, 0);
  const activeDays = Object.values(data).filter(v => v > 0).length;

  // Cell size in px
  const cellSize = 14;
  const cellGap = 3;
  const labelWidth = 32;
  const numWeeks = weeks.length;

  return (
    <div className="select-none">
      {/* Stats row */}
      <div className="flex items-center gap-6 mb-4 text-sm text-muted-foreground">
        <div>
          <span className="font-semibold text-foreground text-lg">{totalSessions}</span>
          <span className="ml-1.5">{language === 'zh' ? '次训练' : 'sessions'}</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div>
          <span className="font-semibold text-foreground text-lg">{activeDays}</span>
          <span className="ml-1.5">{language === 'zh' ? '天活跃' : 'active days'}</span>
        </div>
      </div>

      {/* Calendar container */}
      <div className="overflow-x-auto">
        <div className="relative" style={{ minWidth: labelWidth + numWeeks * (cellSize + cellGap) }}>
          {/* Month labels row - absolutely positioned to align with grid columns */}
          <div className="relative mb-1.5 h-4" style={{ marginLeft: labelWidth }}>
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="text-xs text-muted-foreground font-medium absolute top-0"
                style={{
                  left: label.colStart * (cellSize + cellGap),
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          {/* Grid: day labels + cells */}
          <div className="flex" style={{ gap: cellGap }}>
            {/* Day labels */}
            <div className="flex flex-col" style={{ width: labelWidth, gap: cellGap }}>
              {dayLabels.map((label, i) => (
                <div
                  key={i}
                  className="text-[11px] text-muted-foreground flex items-center justify-end pr-2"
                  style={{ height: cellSize }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col" style={{ gap: cellGap }}>
                {week.map((cell, dayIndex) => {
                  const todayStr = format(new Date(), 'yyyy-MM-dd');
                  const cellDateStr = format(cell.date, 'yyyy-MM-dd');
                  const isToday = cellDateStr === todayStr;
                  const isFuture = cell.date > new Date();

                  return (
                    <div
                      key={dayIndex}
                      className={`rounded-[3px] transition-all duration-150 ${
                        isFuture
                          ? 'bg-transparent'
                          : getColor(cell.count)
                      } ${
                        isToday ? 'ring-2 ring-foreground/25 ring-offset-1 ring-offset-background' : ''
                      } ${
                        !isFuture ? 'cursor-pointer hover:ring-2 hover:ring-emerald-400/60 hover:ring-offset-1 hover:ring-offset-background hover:scale-125' : ''
                      }`}
                      style={{ width: cellSize, height: cellSize }}
                      onMouseEnter={(e) => {
                        if (!isFuture) {
                          setHoveredCell({ date: cellDateStr, count: cell.count, x: e.clientX, y: e.clientY });
                        }
                      }}
                      onMouseMove={(e) => {
                        if (hoveredCell) {
                          setHoveredCell(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                        }
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 px-3 py-2 text-xs bg-popover text-popover-foreground border border-border rounded-lg shadow-lg pointer-events-none"
          style={{
            left: hoveredCell.x + 12,
            top: hoveredCell.y - 40,
          }}
        >
          <div className="font-semibold">{hoveredCell.date}</div>
          <div className="text-muted-foreground">
            {hoveredCell.count === 0
              ? (language === 'zh' ? '未训练' : 'No training')
              : `${hoveredCell.count} ${language === 'zh' ? '次训练' : 'session(s)'}`
            }
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
        <span>{language === 'zh' ? '少' : 'Less'}</span>
        <div className="flex gap-[3px]">
          {[0, 1, 2, 3, 4, 5].map(count => (
            <div
              key={count}
              className={`rounded-[3px] ${getColor(count)}`}
              style={{ width: cellSize - 2, height: cellSize - 2 }}
            />
          ))}
        </div>
        <span>{language === 'zh' ? '多' : 'More'}</span>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 注意广度测试交互式动画演示组件
 * 展示舒尔特方格的按顺序点击过程
 */

interface AttentionSpanDemoProps {
  onComplete?: () => void;
}

const DEMO_GRID = [
  [12, 3, 18, 7, 21],
  [9, 15, 1, 24, 6],
  [20, 4, 13, 8, 17],
  [2, 19, 11, 25, 14],
  [16, 10, 23, 5, 22],
];

const DEMO_SEQUENCE = [1, 2, 3, 4, 5]; // Show clicking 1-5

export function AttentionSpanDemo({ onComplete }: AttentionSpanDemoProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [clickedNumbers, setClickedNumbers] = useState<number[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= DEMO_SEQUENCE.length - 1) {
          // Reset after showing all steps
          setClickedNumbers([]);
          return 0;
        }
        setClickedNumbers((nums) => [...nums, DEMO_SEQUENCE[prev]]);
        return prev + 1;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  const targetNumber = DEMO_SEQUENCE[currentStep];

  // Find position of target number in grid
  let targetRow = -1;
  let targetCol = -1;
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (DEMO_GRID[i][j] === targetNumber) {
        targetRow = i;
        targetCol = j;
        break;
      }
    }
    if (targetRow !== -1) break;
  }

  return (
    <div className="relative w-full aspect-[4/3] bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center overflow-hidden p-8">
      {/* 标题 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
        演示动画（按数字顺序点击）
      </div>

      {/* 舒尔特方格 */}
      <div className="grid grid-cols-5 gap-2 max-w-md">
        {DEMO_GRID.map((row, rowIdx) =>
          row.map((num, colIdx) => {
            const isClicked = clickedNumbers.includes(num);
            const isTarget = rowIdx === targetRow && colIdx === targetCol;

            return (
              <motion.div
                key={`${rowIdx}-${colIdx}`}
                className={`aspect-square flex items-center justify-center text-2xl font-bold rounded-lg border-2 transition-all ${
                  isClicked
                    ? "bg-green-500 text-white border-green-600"
                    : isTarget
                    ? "bg-blue-500 text-white border-blue-600 scale-110 shadow-lg"
                    : "bg-background border-border"
                }`}
                animate={
                  isTarget
                    ? {
                        scale: [1, 1.1, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(59, 130, 246, 0.7)",
                          "0 0 0 10px rgba(59, 130, 246, 0)",
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 0.6,
                  repeat: isTarget ? Infinity : 0,
                }}
              >
                {num}
              </motion.div>
            );
          })
        )}
      </div>

      {/* 操作提示 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="bg-blue-500 text-white px-6 py-3 rounded-full text-center font-semibold shadow-lg"
          >
            找到并点击数字 <span className="text-2xl">{targetNumber}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 进度指示器 */}
      <div className="absolute top-4 right-4 flex gap-1">
        {DEMO_SEQUENCE.map((_, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full transition-colors ${
              idx <= currentStep ? "bg-green-500" : "bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>

      {/* 当前目标提示 */}
      <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg border">
        <div className="text-xs text-muted-foreground">当前目标</div>
        <div className="text-3xl font-bold text-blue-500">{targetNumber}</div>
      </div>
    </div>
  );
}

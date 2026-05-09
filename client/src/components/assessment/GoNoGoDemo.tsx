import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Go/No-Go测试交互式动画演示组件
 * 展示绿色/红色圆圈，指示何时按/不按空格
 */

interface GoNoGoDemoProps {
  onComplete?: () => void;
}

type TrialType = "go" | "nogo";
const DEMO_SEQUENCE: TrialType[] = ["go", "go", "nogo", "go", "nogo", "go", "go", "nogo"];
const TRIAL_DURATION = 1500; // ms per trial

export function GoNoGoDemo({ onComplete }: GoNoGoDemoProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= DEMO_SEQUENCE.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, TRIAL_DURATION);

    return () => clearInterval(timer);
  }, []);

  const currentType = DEMO_SEQUENCE[currentIndex];
  const isGo = currentType === "go";

  return (
    <div className="relative w-full aspect-[4/3] bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center overflow-hidden">
      {/* 标题 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
        演示动画（自动循环）
      </div>

      {/* 圆圈显示区域 */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className={`w-48 h-48 rounded-full shadow-2xl ${
              isGo
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          />
        </AnimatePresence>
      </div>

      {/* 操作提示 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full px-8">
        <AnimatePresence mode="wait">
          {isGo ? (
            <motion.div
              key="go"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-green-500 text-white px-6 py-3 rounded-full text-center font-semibold shadow-lg flex items-center justify-center gap-2"
            >
              <span className="text-2xl">✓</span>
              <span>绿色圆圈 - 按空格键！</span>
            </motion.div>
          ) : (
            <motion.div
              key="nogo"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-red-500 text-white px-6 py-3 rounded-full text-center font-semibold shadow-lg flex items-center justify-center gap-2"
            >
              <span className="text-2xl">✕</span>
              <span>红色圆圈 - 不要按键！</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 进度指示器 */}
      <div className="absolute top-4 right-4 flex gap-1">
        {DEMO_SEQUENCE.map((type, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full transition-colors ${
              idx === currentIndex
                ? type === "go"
                  ? "bg-green-500"
                  : "bg-red-500"
                : "bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>

      {/* 图例 */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Go (按键)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span className="text-muted-foreground">No-Go (不按)</span>
        </div>
      </div>
    </div>
  );
}

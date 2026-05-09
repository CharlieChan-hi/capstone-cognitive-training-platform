import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * N-back测试交互式动画演示组件
 * 展示数字序列，标注匹配/不匹配的情况
 */

interface NBackDemoProps {
  onComplete?: () => void;
}

const DEMO_SEQUENCE = [3, 7, 3, 5, 7, 2, 5, 8]; // 第3个和第5个是匹配的（2-back）
const LETTER_DURATION = 1500; // ms per number

export function NBackDemo({ onComplete }: NBackDemoProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev >= DEMO_SEQUENCE.length - 1 ? 0 : prev + 1;
        // Reset history when looping
        if (next === 0) {
          setHistory([]);
        }
        return next;
      });
    }, LETTER_DURATION);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Update history
    if (currentIndex > 0 || history.length === 0) {
      setHistory((prev) => [...prev, DEMO_SEQUENCE[currentIndex]]);
    }
  }, [currentIndex]);

  const currentNumber = DEMO_SEQUENCE[currentIndex];
  const twoBack = history.length >= 2 ? history[history.length - 2] : null;
  const isMatch = twoBack !== null && currentNumber === twoBack;

  return (
    <div className="relative w-full aspect-[4/3] bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center overflow-hidden">
      {/* 标题 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
        演示动画（2-back规则）
      </div>

      {/* 历史序列显示 */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex gap-2 items-center">
        {history.slice(-3).map((num, idx) => (
          <div
            key={`${idx}-${num}`}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold ${
              idx === history.slice(-3).length - 1
                ? "bg-primary text-primary-foreground"
                : idx === history.slice(-3).length - 3
                ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {num}
          </div>
        ))}
        {history.length >= 2 && (
          <div className="text-xs text-muted-foreground ml-2">
            2步前: {twoBack}
          </div>
        )}
      </div>

      {/* 当前数字显示区域 */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ scale: 0, opacity: 0, rotateY: -90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0, opacity: 0, rotateY: 90 }}
            transition={{ duration: 0.3 }}
            className={`text-9xl font-bold ${
              isMatch
                ? "text-green-500"
                : "text-primary"
            }`}
          >
            {currentNumber}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 操作提示 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full px-8">
        <AnimatePresence mode="wait">
          {history.length < 2 ? (
            <motion.div
              key="waiting"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-muted px-6 py-3 rounded-full text-center text-muted-foreground"
            >
              等待前2个数字...
            </motion.div>
          ) : isMatch ? (
            <motion.div
              key="match"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-green-500 text-white px-6 py-3 rounded-full text-center font-semibold shadow-lg"
            >
              ✓ 匹配！按空格键
            </motion.div>
          ) : (
            <motion.div
              key="no-match"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-muted px-6 py-3 rounded-full text-center text-muted-foreground"
            >
              不匹配，不要按键
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 进度指示器 */}
      <div className="absolute top-4 right-4 flex gap-1">
        {DEMO_SEQUENCE.map((_, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full transition-colors ${
              idx === currentIndex
                ? "bg-primary"
                : "bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

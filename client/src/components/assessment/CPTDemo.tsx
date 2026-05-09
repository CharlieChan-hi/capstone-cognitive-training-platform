import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * CPT测试交互式动画演示组件
 * 展示字母X和其他字母的出现，高亮显示何时应该按空格
 */

interface CPTDemoProps {
  onComplete?: () => void;
}

const DEMO_LETTERS = ["A", "X", "B", "X", "C", "D", "X", "E"];
const LETTER_DURATION = 1200; // ms per letter

export function CPTDemo({ onComplete }: CPTDemoProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= DEMO_LETTERS.length - 1) {
          // Loop back to start
          return 0;
        }
        return prev + 1;
      });
    }, LETTER_DURATION);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Show prompt when letter X appears
    const currentLetter = DEMO_LETTERS[currentIndex];
    if (currentLetter === "X") {
      setShowPrompt(true);
      const timeout = setTimeout(() => setShowPrompt(false), LETTER_DURATION - 200);
      return () => clearTimeout(timeout);
    } else {
      setShowPrompt(false);
    }
  }, [currentIndex]);

  const currentLetter = DEMO_LETTERS[currentIndex];
  const isTarget = currentLetter === "X";

  return (
    <div className="relative w-full aspect-[4/3] bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center overflow-hidden">
      {/* 标题 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
        演示动画（自动循环）
      </div>

      {/* 字母显示区域 */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`text-9xl font-bold ${
              isTarget
                ? "text-green-500"
                : "text-muted-foreground"
            }`}
          >
            {currentLetter}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 操作提示 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full px-8">
        <AnimatePresence>
          {showPrompt && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-green-500 text-white px-6 py-3 rounded-full text-center font-semibold shadow-lg"
            >
              ✓ 看到 X 时按空格！
            </motion.div>
          )}
          {!showPrompt && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-muted px-6 py-3 rounded-full text-center text-muted-foreground"
            >
              其他字母不要按键
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 进度指示器 */}
      <div className="absolute top-4 right-4 flex gap-1">
        {DEMO_LETTERS.map((letter, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full transition-colors ${
              idx === currentIndex
                ? letter === "X"
                  ? "bg-green-500"
                  : "bg-primary"
                : "bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

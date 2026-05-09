import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Stroop测试交互式动画演示组件
 * 展示颜色词和字体颜色的一致/不一致情况
 */

interface StroopDemoProps {
  onComplete?: () => void;
}

interface DemoTrial {
  word: string;
  color: string;
  type: "congruent" | "incongruent";
  correctAnswer: string;
}

const COLOR_NAMES: Record<string, string> = {
  red: "红色",
  green: "绿色",
  blue: "蓝色",
  yellow: "黄色",
};

const DEMO_SEQUENCE: DemoTrial[] = [
  { word: "red", color: "red", type: "congruent", correctAnswer: "红色" },
  { word: "green", color: "red", type: "incongruent", correctAnswer: "红色" },
  { word: "blue", color: "blue", type: "congruent", correctAnswer: "蓝色" },
  { word: "yellow", color: "green", type: "incongruent", correctAnswer: "绿色" },
  { word: "green", color: "green", type: "congruent", correctAnswer: "绿色" },
  { word: "red", color: "yellow", type: "incongruent", correctAnswer: "黄色" },
];

const TRIAL_DURATION = 2000; // ms per trial

export function StroopDemo({ onComplete }: StroopDemoProps) {
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

  const currentTrial = DEMO_SEQUENCE[currentIndex];
  const isCongruent = currentTrial.type === "congruent";

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      red: "text-red-500",
      green: "text-green-500",
      blue: "text-blue-500",
      yellow: "text-yellow-500",
    };
    return colorMap[color] || "";
  };

  return (
    <div className="relative w-full aspect-[4/3] bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center overflow-hidden">
      {/* 标题 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
        演示动画（忽略文字，关注颜色）
      </div>

      {/* 颜色词显示区域 */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ scale: 0.5, opacity: 0, rotateX: -90 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotateX: 90 }}
            transition={{ duration: 0.3 }}
            className={`text-8xl font-bold ${getColorClass(currentTrial.color)}`}
          >
            {COLOR_NAMES[currentTrial.word]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 操作提示 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-prompt`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className={`px-6 py-3 rounded-full text-center font-semibold shadow-lg ${
              isCongruent
                ? "bg-blue-500 text-white"
                : "bg-orange-500 text-white"
            }`}
          >
            <div className="flex flex-col gap-1">
              <div className="text-xs opacity-80">
                {isCongruent ? "一致条件" : "不一致条件 - 需要抑制干扰"}
              </div>
              <div>
                字体颜色是 <strong>{currentTrial.correctAnswer}</strong>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 进度指示器 */}
      <div className="absolute top-4 right-4 flex gap-1">
        {DEMO_SEQUENCE.map((trial, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full transition-colors ${
              idx === currentIndex
                ? trial.type === "congruent"
                  ? "bg-blue-500"
                  : "bg-orange-500"
                : "bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>

      {/* 图例 */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">一致</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500" />
          <span className="text-muted-foreground">不一致</span>
        </div>
      </div>
    </div>
  );
}

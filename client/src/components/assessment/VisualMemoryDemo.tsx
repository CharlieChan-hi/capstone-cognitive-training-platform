import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 视觉记忆测试交互式动画演示组件
 * 展示翻牌配对的过程
 */

interface VisualMemoryDemoProps {
  onComplete?: () => void;
}

type DemoStep = "show" | "flip1" | "flip2" | "match" | "reset";

const DEMO_GRID = [
  ["🍎", "🍌", "🍇", "🍊"],
  ["🍓", "🍎", "🍌", "🍇"],
  ["🍊", "🍓", "🍉", "🍉"],
  ["🍒", "🍒", "🍋", "🍋"],
];

export function VisualMemoryDemo({ onComplete }: VisualMemoryDemoProps) {
  const [step, setStep] = useState<DemoStep>("show");
  const [flippedCards, setFlippedCards] = useState<[number, number][]>([]);
  const [matchedCards, setMatchedCards] = useState<[number, number][]>([]);

  useEffect(() => {
    const sequence = [
      { step: "show" as DemoStep, delay: 2000 },
      { step: "flip1" as DemoStep, delay: 1500, card: [0, 0] as [number, number] },
      { step: "flip2" as DemoStep, delay: 1500, card: [1, 1] as [number, number] },
      { step: "match" as DemoStep, delay: 1500 },
      { step: "reset" as DemoStep, delay: 2000 },
    ];

    let timeoutId: NodeJS.Timeout;
    let currentIdx = 0;

    const runSequence = () => {
      if (currentIdx >= sequence.length) {
        // Loop back
        currentIdx = 0;
        setFlippedCards([]);
        setMatchedCards([]);
      }

      const current = sequence[currentIdx];
      setStep(current.step);

      if (current.step === "flip1") {
        setFlippedCards([current.card!]);
      } else if (current.step === "flip2") {
        setFlippedCards((prev) => [...prev, current.card!]);
      } else if (current.step === "match") {
        setMatchedCards(flippedCards);
      } else if (current.step === "reset") {
        setFlippedCards([]);
        setMatchedCards([]);
      }

      currentIdx++;
      timeoutId = setTimeout(runSequence, current.delay);
    };

    runSequence();

    return () => clearTimeout(timeoutId);
  }, []);

  const isFlipped = (row: number, col: number) => {
    return (
      flippedCards.some(([r, c]) => r === row && c === col) ||
      matchedCards.some(([r, c]) => r === row && c === col)
    );
  };

  const isMatched = (row: number, col: number) => {
    return matchedCards.some(([r, c]) => r === row && c === col);
  };

  const isHighlighted = (row: number, col: number) => {
    if (step === "flip1" && flippedCards.length === 1) {
      return flippedCards[0][0] === row && flippedCards[0][1] === col;
    }
    if (step === "flip2" && flippedCards.length === 2) {
      return flippedCards[1][0] === row && flippedCards[1][1] === col;
    }
    return false;
  };

  return (
    <div className="relative w-full aspect-[4/3] bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center overflow-hidden p-8">
      {/* 标题 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
        演示动画（翻牌配对）
      </div>

      {/* 卡片网格 */}
      <div className="grid grid-cols-4 gap-3 max-w-lg">
        {DEMO_GRID.map((row, rowIdx) =>
          row.map((emoji, colIdx) => {
            const flipped = isFlipped(rowIdx, colIdx);
            const matched = isMatched(rowIdx, colIdx);
            const highlighted = isHighlighted(rowIdx, colIdx);

            return (
              <motion.div
                key={`${rowIdx}-${colIdx}`}
                className={`aspect-square flex items-center justify-center text-4xl rounded-lg cursor-pointer transition-all ${
                  matched
                    ? "bg-green-500 border-green-600"
                    : highlighted
                    ? "bg-blue-500 border-blue-600 scale-110 shadow-lg"
                    : flipped
                    ? "bg-primary border-primary"
                    : "bg-muted border-border"
                } border-2`}
                animate={
                  highlighted
                    ? {
                        scale: [1, 1.1, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(59, 130, 246, 0.7)",
                          "0 0 0 10px rgba(59, 130, 246, 0)",
                        ],
                      }
                    : {}
                }
                transition={{ duration: 0.6 }}
              >
                <AnimatePresence mode="wait">
                  {(flipped || step === "show") ? (
                    <motion.div
                      key="front"
                      initial={{ rotateY: -90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: 90, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {emoji}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="back"
                      initial={{ rotateY: -90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: 90, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-2xl text-muted-foreground"
                    >
                      ?
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* 操作提示 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full px-8">
        <AnimatePresence mode="wait">
          {step === "show" && (
            <motion.div
              key="show"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-muted px-6 py-3 rounded-full text-center text-muted-foreground"
            >
              记住所有卡片的位置...
            </motion.div>
          )}
          {step === "flip1" && (
            <motion.div
              key="flip1"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-blue-500 text-white px-6 py-3 rounded-full text-center font-semibold shadow-lg"
            >
              翻开第一张卡片
            </motion.div>
          )}
          {step === "flip2" && (
            <motion.div
              key="flip2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-blue-500 text-white px-6 py-3 rounded-full text-center font-semibold shadow-lg"
            >
              找到配对的卡片
            </motion.div>
          )}
          {step === "match" && (
            <motion.div
              key="match"
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-green-500 text-white px-6 py-3 rounded-full text-center font-semibold shadow-lg"
            >
              ✓ 配对成功！
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 配对计数 */}
      <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg border">
        <div className="text-xs text-muted-foreground">已配对</div>
        <div className="text-2xl font-bold text-green-500">
          {matchedCards.length / 2} / 8
        </div>
      </div>
    </div>
  );
}

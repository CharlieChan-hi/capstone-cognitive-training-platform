import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertTriangle } from "lucide-react";

export type FeedbackType = "correct" | "incorrect" | "miss" | null;

interface FeedbackOverlayProps {
  feedback: FeedbackType;
  onComplete?: () => void;
}

/**
 * 即时视觉反馈组件
 * 在测试中显示用户响应的即时反馈（正确/错误/漏报）
 */
export function FeedbackOverlay({ feedback, onComplete }: FeedbackOverlayProps) {
  if (!feedback) return null;

  const config = {
    correct: {
      icon: Check,
      color: "text-green-500",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500",
      label: "正确！",
    },
    incorrect: {
      icon: X,
      color: "text-red-500",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-500",
      label: "错误",
    },
    miss: {
      icon: AlertTriangle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500",
      label: "漏报",
    },
  };

  const { icon: Icon, color, bgColor, borderColor, label } = config[feedback];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.2 }}
        onAnimationComplete={() => {
          // 300ms后自动调用onComplete
          setTimeout(() => {
            onComplete?.();
          }, 300);
        }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: feedback === "incorrect" ? [0, -8, 8, -8, 8, 0] : 0 }}
          transition={{ duration: 0.4 }}
          className={`${bgColor} ${borderColor} border-2 rounded-full p-4 shadow-lg`}
        >
          <Icon className={`${color} w-12 h-12 stroke-[2.5]`} />
        </motion.div>
        
        {/* 文字标签 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`absolute mt-24 ${color} text-lg font-semibold`}
        >
          {label}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

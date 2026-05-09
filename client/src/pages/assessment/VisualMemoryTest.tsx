import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VisualMemoryDemo } from "@/components/assessment/VisualMemoryDemo";

/**
 * Visual Spatial Memory Test - 视觉空间记忆测试（基于记忆翻牌）
 * 
 * 测试参数（固定，确保科学可重复性）：
 * - 网格大小：4×4
 * - 卡片对数：8对（16张卡片）
 * - 图案：使用emoji符号
 * - 测试次数：1次完整游戏
 * - 记录所有翻牌操作
 * 
 * 记录指标：
 * - Total Flips (总翻牌次数)
 * - Matched Pairs (成功配对数)
 * - Error Rate (错误率 = 错误翻牌 / 总翻牌)
 * - Completion Time (完成时间)
 * - Memory Efficiency (记忆效率 = 最小翻牌次数 / 实际翻牌次数)
 * - Visual Memory Score (视觉记忆分数)
 */

interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface FlipRecord {
  timestamp: number;
  cardId: number;
  symbol: string;
  isMatch: boolean;
}

const GRID_SIZE = 4;
const TOTAL_PAIRS = 8;
const SYMBOLS = ["🍎", "🍌", "🍇", "🍊", "🍓", "🍉", "🍒", "🍑"];

interface VisualMemoryTestProps {
  onComplete?: (results: any) => void;
}

export default function VisualMemoryTest({ onComplete }: VisualMemoryTestProps = {}) {
  const [, setLocation] = useLocation();
  
  const [phase, setPhase] = useState<"instruction" | "practice" | "test" | "complete">("instruction");
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [flips, setFlips] = useState<FlipRecord[]>([]);
  const [canFlip, setCanFlip] = useState(true);
  
  const startTimeRef = useRef(0);
  const isPracticeRef = useRef(false);

  // Generate cards
  const generateCards = (): Card[] => {
    const pairs: string[] = [];
    for (let i = 0; i < TOTAL_PAIRS; i++) {
      pairs.push(SYMBOLS[i], SYMBOLS[i]);
    }
    
    // Shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    
    return pairs.map((symbol, index) => ({
      id: index,
      symbol,
      isFlipped: false,
      isMatched: false,
    }));
  };

  // Start practice
  const startPractice = () => {
    isPracticeRef.current = true;
    setPhase("practice");
    setCards(generateCards());
    setFlippedCards([]);
    setMatchedPairs(0);
    setFlips([]);
    setCanFlip(true);
    startTimeRef.current = Date.now();
  };

  // Start actual test
  const startTest = () => {
    isPracticeRef.current = false;
    setPhase("test");
    setCards(generateCards());
    setFlippedCards([]);
    setMatchedPairs(0);
    setFlips([]);
    setCanFlip(true);
    startTimeRef.current = Date.now();
  };

  // Handle card click
  const handleCardClick = (cardId: number) => {
    if (!canFlip) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;
    
    // Flip the card
    const newCards = cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);
    
    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);
    
    if (newFlippedCards.length === 2) {
      // Check for match
      setCanFlip(false);
      
      const [firstId, secondId] = newFlippedCards;
      const firstCard = newCards.find(c => c.id === firstId)!;
      const secondCard = newCards.find(c => c.id === secondId)!;
      
      const isMatch = firstCard.symbol === secondCard.symbol;
      
      // Record flips
      const flipRecord: FlipRecord = {
        timestamp: Date.now(),
        cardId: secondId,
        symbol: secondCard.symbol,
        isMatch,
      };
      setFlips(prev => [...prev, flipRecord]);
      
      if (isMatch) {
        // Match found
        setTimeout(() => {
          const matchedCards = newCards.map(c => 
            c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
          );
          setCards(matchedCards);
          setFlippedCards([]);
          setMatchedPairs(matchedPairs + 1);
          setCanFlip(true);
          
          // Check if game complete
          if (matchedPairs + 1 === TOTAL_PAIRS) {
            finishTest();
          }
        }, 800);
      } else {
        // No match, flip back
        setTimeout(() => {
          const flippedBackCards = newCards.map(c => 
            c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
          );
          setCards(flippedBackCards);
          setFlippedCards([]);
          setCanFlip(true);
        }, 1200);
      }
    } else {
      // First card of pair
      const flipRecord: FlipRecord = {
        timestamp: Date.now(),
        cardId,
        symbol: card.symbol,
        isMatch: false,
      };
      setFlips(prev => [...prev, flipRecord]);
    }
  };

  // Finish test
  const finishTest = () => {
    if (isPracticeRef.current) {
      setPhase("instruction");
    } else {
      setPhase("complete");
    }
  };

  // Calculate performance metrics
  const calculateMetrics = () => {
    const completionTime = flips.length > 0 ? flips[flips.length - 1].timestamp - startTimeRef.current : 0;
    const totalFlips = flips.length;
    const minFlips = TOTAL_PAIRS * 2; // Minimum flips needed (perfect memory)
    const errorFlips = totalFlips - minFlips;
    const errorRate = totalFlips > 0 ? errorFlips / totalFlips : 0;
    const memoryEfficiency = totalFlips > 0 ? minFlips / totalFlips : 0;
    
    // Visual Memory Score (higher is better)
    // Based on efficiency and completion time
    const timeScore = Math.max(0, 1 - (completionTime / 120000)); // Normalize to 2 minutes
    const visualMemoryScore = (memoryEfficiency * 0.7 + timeScore * 0.3) * 100;
    
    return {
      totalFlips,
      matchedPairs: TOTAL_PAIRS,
      errorFlips,
      errorRate,
      completionTime,
      memoryEfficiency,
      visualMemoryScore,
    };
  };

  // Save results and navigate
  const saveAndContinue = async () => {
    const metrics = calculateMetrics();
    
    // TODO: Save to backend via API
    console.log("Visual Memory Test Results:", metrics);
    
    // If onComplete callback is provided, call it instead of navigating
    if (onComplete) {
      onComplete(metrics);
    } else {
      // Navigate to assessment results
      setLocation("/assessment/results");
    }
  };

  if (phase === "instruction") {
    const showPracticeComplete = flips.length > 0;
    
    return (
      <div className="container max-w-4xl py-8">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-6">视觉空间记忆测试 (记忆翻牌)</h1>
          
          {/* 交互式动画演示 */}
          <div className="mb-8">
            <VisualMemoryDemo />
          </div>
          
          <div className="space-y-4">
            <p>
              这是一个视觉空间记忆测试，用于评估您的短期视觉记忆和空间定位能力。
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h2 className="font-semibold mb-2">测试说明：</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>屏幕上会显示一个4×4的卡片网格（共16张卡片）</li>
                <li>卡片背面相同，正面有8种不同的图案，每种2张</li>
                <li>点击卡片翻开，找到<strong>相同图案的两张卡片</strong>配对</li>
                <li>每次可以翻开2张卡片</li>
                <li>如果两张卡片图案相同，它们会保持翻开状态</li>
                <li>如果不同，它们会自动翻回背面</li>
                <li>目标是用<strong>最少的翻牌次数</strong>找到所有配对</li>
              </ul>
            </div>
            
            {showPracticeComplete && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm">
                  <strong>练习完成！</strong>您已了解测试流程。准备好后开始正式测试。
                </p>
              </div>
            )}
            
            {!showPracticeComplete && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm">
                  <strong>提示：</strong>建议先完成练习，熟悉测试流程。
                </p>
              </div>
            )}
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm">
                <strong>重要提示：</strong>请在安静的环境中完成测试。
                测试大约需要2-5分钟。
              </p>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4">
            <Button onClick={() => setLocation("/assessment")} variant="outline">
              返回
            </Button>
            {!showPracticeComplete && (
              <Button onClick={startPractice} variant="outline" className="flex-1">
                练习
              </Button>
            )}
            <Button onClick={startTest} className="flex-1">
              开始正式测试
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === "practice" || phase === "test") {
    const isPractice = phase === "practice";
    
    return (
      <div className="container max-w-4xl py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <div className="text-sm text-muted-foreground">
              {isPractice ? "练习" : "正式测试"}
            </div>
            <div className="text-2xl font-bold">
              已配对：<span className="text-primary">{matchedPairs} / {TOTAL_PAIRS}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">翻牌次数</div>
            <div className="text-2xl font-bold">{flips.length}</div>
          </div>
        </div>
        
        <Card className="p-6">
          <div className="grid grid-cols-4 gap-4 aspect-square">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={!canFlip || card.isFlipped || card.isMatched}
                className={`
                  flex items-center justify-center
                  text-5xl
                  rounded-xl
                  transition-all
                  transform
                  ${card.isMatched 
                    ? "bg-green-100 dark:bg-green-900/30 scale-95 opacity-60" 
                    : card.isFlipped
                    ? "bg-white dark:bg-gray-800 shadow-lg"
                    : "bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 cursor-pointer active:scale-95"
                  }
                  ${!canFlip && !card.isMatched && !card.isFlipped ? "opacity-50" : ""}
                `}
              >
                {(card.isFlipped || card.isMatched) ? card.symbol : "❓"}
              </button>
            ))}
          </div>
        </Card>
        
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {flippedCards.length === 1 && "选择第二张卡片..."}
        </div>
      </div>
    );
  }

  if (phase === "complete") {
    const metrics = calculateMetrics();
    
    return (
      <div className="container max-w-2xl py-8">
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6">测试完成！</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">总翻牌次数</div>
                <div className="text-2xl font-bold">{metrics.totalFlips}</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">完成时间</div>
                <div className="text-2xl font-bold">{(metrics.completionTime / 1000).toFixed(1)}秒</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">错误翻牌</div>
                <div className="text-2xl font-bold">{metrics.errorFlips}</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">记忆效率</div>
                <div className="text-2xl font-bold">{(metrics.memoryEfficiency * 100).toFixed(1)}%</div>
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-sm text-muted-foreground mb-1">视觉记忆分数</div>
              <div className="text-3xl font-bold">{metrics.visualMemoryScore.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                (分数越高越好，满分100)
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm">
                <strong>评价：</strong>
                {metrics.memoryEfficiency >= 0.8 && " 优秀的视觉记忆能力！"}
                {metrics.memoryEfficiency >= 0.6 && metrics.memoryEfficiency < 0.8 && " 良好的视觉记忆能力。"}
                {metrics.memoryEfficiency < 0.6 && " 继续练习可以提升记忆效率。"}
              </p>
            </div>
            
            <p className="text-muted-foreground">
              您的测试数据已记录。这是第6项评估测试。
            </p>
          </div>
          
          <div className="mt-8">
            <Button onClick={saveAndContinue} className="w-full" size="lg">
              查看完整评估报告
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}

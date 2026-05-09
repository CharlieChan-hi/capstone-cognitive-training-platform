import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AttentionSpanDemo } from "@/components/assessment/AttentionSpanDemo";

/**
 * Attention Span Test - 注意广度测试（基于舒尔特方格）
 * 
 * 测试参数（固定，确保科学可重复性）：
 * - 网格大小：5×5
 * - 数字范围：1-25
 * - 任务：按顺序点击1到25
 * - 测试次数：3次（取平均值）
 * - 无时间限制（但记录完成时间）
 * 
 * 记录指标：
 * - Completion Time (完成时间)
 * - Error Count (错误次数)
 * - Mean Reaction Time per Click (平均每次点击反应时)
 * - Attention Span Score (注意广度分数)
 * - Consistency (一致性 - 3次测试的标准差)
 */

interface ClickRecord {
  number: number;
  correct: boolean;
  timestamp: number;
  reactionTime: number;
}

interface TestRound {
  roundNumber: number;
  completionTime: number;
  errorCount: number;
  clicks: ClickRecord[];
  meanRT: number;
}

const GRID_SIZE = 5;
const TOTAL_NUMBERS = GRID_SIZE * GRID_SIZE;
const TOTAL_ROUNDS = 3;

interface AttentionSpanTestProps {
  onComplete?: (results: any) => void;
}

export default function AttentionSpanTest({ onComplete }: AttentionSpanTestProps = {}) {
  const [, setLocation] = useLocation();
  
  const [phase, setPhase] = useState<"instruction" | "practice" | "test" | "rest" | "complete">("instruction");
  const [currentRound, setCurrentRound] = useState(0);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [grid, setGrid] = useState<number[]>([]);
  const [clicks, setClicks] = useState<ClickRecord[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  
  const [testRounds, setTestRounds] = useState<TestRound[]>([]);
  const [practiceRound, setPracticeRound] = useState<TestRound | null>(null);
  
  const startTimeRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  // Generate shuffled grid
  const generateGrid = () => {
    const numbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    // Shuffle
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers;
  };

  // Start practice
  const startPractice = () => {
    setPhase("practice");
    setCurrentRound(0);
    setCurrentNumber(1);
    setClicks([]);
    setErrorCount(0);
    setGrid(generateGrid());
    startTimeRef.current = Date.now();
    lastClickTimeRef.current = Date.now();
  };

  // Start actual test
  const startTest = () => {
    setPhase("test");
    setCurrentRound(0);
    setCurrentNumber(1);
    setClicks([]);
    setErrorCount(0);
    setTestRounds([]);
    setGrid(generateGrid());
    startTimeRef.current = Date.now();
    lastClickTimeRef.current = Date.now();
  };

  // Handle number click
  const handleNumberClick = (number: number) => {
    const now = Date.now();
    const reactionTime = now - lastClickTimeRef.current;
    const correct = number === currentNumber;
    
    const clickRecord: ClickRecord = {
      number,
      correct,
      timestamp: now,
      reactionTime,
    };
    
    setClicks(prev => [...prev, clickRecord]);
    lastClickTimeRef.current = now;
    
    if (correct) {
      if (currentNumber === TOTAL_NUMBERS) {
        // Round complete
        finishRound();
      } else {
        setCurrentNumber(currentNumber + 1);
      }
    } else {
      setErrorCount(errorCount + 1);
    }
  };

  // Finish current round
  const finishRound = () => {
    const completionTime = Date.now() - startTimeRef.current;
    const correctClicks = clicks.filter(c => c.correct);
    const meanRT = correctClicks.length > 0 
      ? correctClicks.reduce((sum, c) => sum + c.reactionTime, 0) / correctClicks.length 
      : 0;
    
    const roundResult: TestRound = {
      roundNumber: currentRound + 1,
      completionTime,
      errorCount,
      clicks: [...clicks, { 
        number: TOTAL_NUMBERS, 
        correct: true, 
        timestamp: Date.now(), 
        reactionTime: Date.now() - lastClickTimeRef.current 
      }],
      meanRT,
    };
    
    if (phase === "practice") {
      setPracticeRound(roundResult);
      setPhase("instruction");
    } else {
      setTestRounds(prev => [...prev, roundResult]);
      
      if (currentRound + 1 < TOTAL_ROUNDS) {
        // Next round
        setPhase("rest");
      } else {
        // Test complete
        setPhase("complete");
      }
    }
  };

  // Continue to next round
  const continueNextRound = () => {
    setPhase("test");
    setCurrentRound(currentRound + 1);
    setCurrentNumber(1);
    setClicks([]);
    setErrorCount(0);
    setGrid(generateGrid());
    startTimeRef.current = Date.now();
    lastClickTimeRef.current = Date.now();
  };

  // Calculate performance metrics
  const calculateMetrics = () => {
    const completionTimes = testRounds.map(r => r.completionTime);
    const errorCounts = testRounds.map(r => r.errorCount);
    const meanRTs = testRounds.map(r => r.meanRT);
    
    const avgCompletionTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
    const avgErrorCount = errorCounts.reduce((a, b) => a + b, 0) / errorCounts.length;
    const avgMeanRT = meanRTs.reduce((a, b) => a + b, 0) / meanRTs.length;
    
    // Calculate standard deviation for consistency
    const sdCompletionTime = calculateSD(completionTimes);
    
    // Attention Span Score (lower is better, normalized)
    // Based on completion time and errors
    const attentionSpanScore = (avgCompletionTime / 1000) + (avgErrorCount * 2);
    
    return {
      rounds: testRounds.length,
      avgCompletionTime,
      avgErrorCount,
      avgMeanRT,
      sdCompletionTime,
      attentionSpanScore,
      consistency: 1 / (1 + sdCompletionTime / avgCompletionTime), // 0-1, higher is better
    };
  };

  // Calculate standard deviation
  const calculateSD = (values: number[]): number => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
    return Math.sqrt(variance);
  };

  // Save results and navigate
  const saveAndContinue = async () => {
    const metrics = calculateMetrics();
    
    // TODO: Save to backend via API
    console.log("Attention Span Test Results:", metrics);
    
    // If onComplete callback is provided, call it instead of navigating
    if (onComplete) {
      onComplete(metrics);
    } else {
      // Navigate to assessment results or next test
      setLocation("/assessment/results");
    }
  };

  if (phase === "instruction") {
    const showPracticeResults = practiceRound !== null;
    
    return (
      <div className="container max-w-4xl py-8">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-6">注意广度测试 (舒尔特方格)</h1>
          
          {/* 交互式动画演示 */}
          <div className="mb-8">
            <AttentionSpanDemo />
          </div>
          
          <div className="space-y-4">
            <p>
              这是一个注意广度测试，用于评估您的视觉搜索能力和注意力分配。
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h2 className="font-semibold mb-2">测试说明：</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>屏幕上会显示一个5×5的网格，包含数字1-25</li>
                <li>您需要<strong>按顺序</strong>点击数字1、2、3...直到25</li>
                <li>尽可能快速且准确地完成</li>
                <li>点错不会结束测试，但会记录错误次数</li>
                <li>测试共进行<strong>3轮</strong>，每轮数字位置随机</li>
              </ul>
            </div>
            
            {showPracticeResults && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm mb-2">
                  <strong>练习完成！</strong>
                </p>
                <div className="text-sm space-y-1">
                  <div>完成时间：{(practiceRound.completionTime / 1000).toFixed(2)}秒</div>
                  <div>错误次数：{practiceRound.errorCount}</div>
                </div>
              </div>
            )}
            
            {!showPracticeResults && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm">
                  <strong>提示：</strong>建议先完成练习，熟悉测试流程。
                </p>
              </div>
            )}
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm">
                <strong>重要提示：</strong>请在安静的环境中完成测试。
                每轮测试大约需要30-60秒。
              </p>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4">
            <Button onClick={() => setLocation("/assessment")} variant="outline">
              返回
            </Button>
            {!showPracticeResults && (
              <Button onClick={startPractice} variant="outline" className="flex-1">
                练习 (1轮)
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

  if (phase === "rest") {
    return (
      <div className="container max-w-2xl py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">休息时间</h2>
          <p className="text-lg mb-2">您已完成第 {currentRound + 1} 轮测试！</p>
          <p className="text-muted-foreground mb-8">
            请休息片刻，准备好后继续下一轮。
          </p>
          <Button onClick={continueNextRound} size="lg">
            继续下一轮
          </Button>
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
              {isPractice ? "练习" : `第 ${currentRound + 1} / ${TOTAL_ROUNDS} 轮`}
            </div>
            <div className="text-2xl font-bold">
              寻找数字：<span className="text-primary">{currentNumber}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">错误次数</div>
            <div className="text-2xl font-bold text-red-500">{errorCount}</div>
          </div>
        </div>
        
        <Card className="p-8">
          <div className="grid grid-cols-5 gap-3 aspect-square">
            {grid.map((number, index) => (
              <button
                key={index}
                onClick={() => handleNumberClick(number)}
                className={`
                  flex items-center justify-center
                  text-3xl font-bold
                  rounded-lg
                  transition-all
                  ${number < currentNumber 
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 cursor-not-allowed" 
                    : "bg-muted hover:bg-primary hover:text-primary-foreground cursor-pointer active:scale-95"
                  }
                `}
                disabled={number < currentNumber}
              >
                {number}
              </button>
            ))}
          </div>
        </Card>
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
                <div className="text-sm text-muted-foreground">平均完成时间</div>
                <div className="text-2xl font-bold">{(metrics.avgCompletionTime / 1000).toFixed(2)}秒</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">平均错误次数</div>
                <div className="text-2xl font-bold">{metrics.avgErrorCount.toFixed(1)}</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">平均反应时</div>
                <div className="text-2xl font-bold">{metrics.avgMeanRT.toFixed(0)}ms</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">一致性</div>
                <div className="text-2xl font-bold">{(metrics.consistency * 100).toFixed(1)}%</div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-muted-foreground mb-1">注意广度分数</div>
              <div className="text-3xl font-bold">{metrics.attentionSpanScore.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                (分数越低越好)
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-semibold">各轮详情：</div>
              {testRounds.map((round, index) => (
                <div key={index} className="text-sm bg-muted p-3 rounded">
                  第{round.roundNumber}轮：
                  {(round.completionTime / 1000).toFixed(2)}秒，
                  {round.errorCount}次错误
                </div>
              ))}
            </div>
            
            <p className="text-muted-foreground">
              您的测试数据已记录。这是第5项评估测试。
            </p>
          </div>
          
          <div className="mt-8">
            <Button onClick={saveAndContinue} className="w-full" size="lg">
              继续下一项测试
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}

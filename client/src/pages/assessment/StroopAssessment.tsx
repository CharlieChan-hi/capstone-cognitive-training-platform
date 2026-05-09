import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StroopDemo } from "@/components/assessment/StroopDemo";
import { MetricTooltip } from '@/components/MetricTooltip';

/**
 * Stroop Assessment - 认知灵活性评估
 * 
 * 测试参数（固定，确保科学可重复性）：
 * - 总试次：30 (优化版，原60试次)
 * - 一致试次（Congruent）：50% (15次) - 颜色词与字体颜色一致
 * - 不一致试次（Incongruent）：50% (15次) - 颜色词与字体颜色不一致
 * - 刺激呈现时间：无限制（直到反应）
 * - 试次间隔（ISI）：1000ms
 * - 颜色选项：红色、绿色、蓝色、黄色
 * 
 * 记录指标：
 * - Congruent Mean RT (一致条件平均反应时)
 * - Incongruent Mean RT (不一致条件平均反应时)
 * - Stroop Effect (Stroop效应 = Incongruent RT - Congruent RT)
 * - Congruent Accuracy (一致条件准确率)
 * - Incongruent Accuracy (不一致条件准确率)
 * - Interference Score (干扰分数)
 * - Cognitive Flexibility Index (认知灵活性指数)
 */

interface Trial {
  trialNumber: number;
  type: "congruent" | "incongruent";
  word: string;
  color: string;
  correctResponse: string;
}

interface TrialResult {
  trialNumber: number;
  type: "congruent" | "incongruent";
  word: string;
  color: string;
  response: string;
  correct: boolean;
  reactionTime: number;
}

const TOTAL_TRIALS = 30; // Reduced from 60 for better UX
const ISI = 1000; // ms
const COLORS = ["red", "green", "blue", "yellow"];
const COLOR_NAMES = {
  red: "红色",
  green: "绿色",
  blue: "蓝色",
  yellow: "黄色",
};

interface StroopAssessmentProps {
  onComplete?: (results: any) => void;
}

export default function StroopAssessment({ onComplete }: StroopAssessmentProps = {}) {
  const [, setLocation] = useLocation();
  
  const [phase, setPhase] = useState<"instruction" | "practice" | "test" | "rest" | "complete">("instruction");
  const [currentTrial, setCurrentTrial] = useState(0);
  const [showStimulus, setShowStimulus] = useState(false);
  const [currentTrialData, setCurrentTrialData] = useState<Trial | null>(null);
  
  const [trials, setTrials] = useState<Trial[]>([]);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [practiceResults, setPracticeResults] = useState<TrialResult[]>([]);
  
  const stimulusOnsetRef = useRef(0);
  const waitingForResponseRef = useRef(false);

  // Generate trials on mount
  useEffect(() => {
    const generatedTrials = generateTrials(TOTAL_TRIALS);
    setTrials(generatedTrials);
  }, []);

  // Generate trial sequence
  const generateTrials = (numTrials: number): Trial[] => {
    const congruentCount = Math.floor(numTrials / 2);
    const incongruentCount = numTrials - congruentCount;
    
    const trialList: Trial[] = [];
    
    // Create congruent trials
    for (let i = 0; i < congruentCount; i++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      trialList.push({
        trialNumber: 0,
        type: "congruent",
        word: color,
        color: color,
        correctResponse: color,
      });
    }
    
    // Create incongruent trials
    for (let i = 0; i < incongruentCount; i++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      let word;
      do {
        word = COLORS[Math.floor(Math.random() * COLORS.length)];
      } while (word === color);
      
      trialList.push({
        trialNumber: 0,
        type: "incongruent",
        word: word,
        color: color,
        correctResponse: color,
      });
    }
    
    // Shuffle trials
    for (let i = trialList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [trialList[i], trialList[j]] = [trialList[j], trialList[i]];
    }
    
    // Set trial numbers
    trialList.forEach((trial, index) => {
      trial.trialNumber = index + 1;
    });
    
    return trialList;
  };

  // Start practice
  const startPractice = () => {
    setPhase("practice");
    setCurrentTrial(0);
    setPracticeResults([]);
    const practiceTrials = generateTrials(8); // 8 practice trials
    setTrials(practiceTrials);
    runTrial(0, true);
  };

  // Start actual test
  const startTest = () => {
    setPhase("test");
    setCurrentTrial(0);
    setResults([]);
    const testTrials = generateTrials(TOTAL_TRIALS);
    setTrials(testTrials);
    runTrial(0, false);
  };

  // Continue after rest
  const continueAfterRest = () => {
    setPhase("test");
    runTrial(currentTrial, false);
  };

  // Run a single trial
  const runTrial = (trialIndex: number, isPractice: boolean) => {
    if (trialIndex >= trials.length) {
      if (isPractice) {
        setPhase("instruction");
      } else {
        finishTest();
      }
      return;
    }

    const trial = trials[trialIndex];
    waitingForResponseRef.current = false;
    
    // Show fixation (+) first
    setShowStimulus(false);
    setCurrentTrialData(null);
    
    // After ISI, show stimulus
    setTimeout(() => {
      const onset = Date.now();
      stimulusOnsetRef.current = onset;
      waitingForResponseRef.current = true;
      
      setCurrentTrialData(trial);
      setShowStimulus(true);
    }, ISI);
  };

  // Handle color button press
  const handleColorResponse = (color: string) => {
    if (!waitingForResponseRef.current || !currentTrialData) return;
    
    waitingForResponseRef.current = false;
    const responseTime = Date.now();
    const reactionTime = responseTime - stimulusOnsetRef.current;
    
    const result: TrialResult = {
      trialNumber: currentTrialData.trialNumber,
      type: currentTrialData.type,
      word: currentTrialData.word,
      color: currentTrialData.color,
      response: color,
      correct: color === currentTrialData.correctResponse,
      reactionTime,
    };
    
    const isPractice = phase === "practice";
    
    if (isPractice) {
      setPracticeResults(prev => [...prev, result]);
    } else {
      setResults(prev => [...prev, result]);
    }
    
    // Hide stimulus
    setShowStimulus(false);
    setCurrentTrialData(null);
    
    setCurrentTrial(currentTrial + 1);
    
    // No rest break for shorter version
    if (currentTrial + 1 < trials.length) {
      runTrial(currentTrial + 1, isPractice);
    } else if (isPractice) {
      setPhase("instruction");
    }
  };

  // Finish test
  const finishTest = () => {
    setPhase("complete");
  };

  // Calculate performance metrics
  const calculateMetrics = () => {
    const congruentTrials = results.filter(r => r.type === "congruent");
    const incongruentTrials = results.filter(r => r.type === "incongruent");
    
    const congruentCorrect = congruentTrials.filter(r => r.correct);
    const incongruentCorrect = incongruentTrials.filter(r => r.correct);
    
    const congruentAccuracy = congruentTrials.length > 0 ? congruentCorrect.length / congruentTrials.length : 0;
    const incongruentAccuracy = incongruentTrials.length > 0 ? incongruentCorrect.length / incongruentTrials.length : 0;
    
    // Calculate RT metrics (only for correct trials)
    const congruentRTs = congruentCorrect.map(r => r.reactionTime);
    const incongruentRTs = incongruentCorrect.map(r => r.reactionTime);
    
    const congruentMeanRT = congruentRTs.length > 0 ? congruentRTs.reduce((a, b) => a + b, 0) / congruentRTs.length : 0;
    const incongruentMeanRT = incongruentRTs.length > 0 ? incongruentRTs.reduce((a, b) => a + b, 0) / incongruentRTs.length : 0;
    
    // Stroop Effect
    const stroopEffect = incongruentMeanRT - congruentMeanRT;
    
    // Interference Score (normalized by congruent RT)
    const interferenceScore = congruentMeanRT > 0 ? stroopEffect / congruentMeanRT : 0;
    
    // Cognitive Flexibility Index (considers both RT and accuracy)
    // Higher score = better cognitive flexibility
    const cognitiveFlexibilityIndex = incongruentAccuracy - (stroopEffect / 1000);
    
    return {
      totalTrials: TOTAL_TRIALS,
      congruentTrials: congruentTrials.length,
      incongruentTrials: incongruentTrials.length,
      congruentAccuracy,
      incongruentAccuracy,
      congruentMeanRT,
      incongruentMeanRT,
      stroopEffect,
      interferenceScore,
      cognitiveFlexibilityIndex,
      overallAccuracy: (congruentCorrect.length + incongruentCorrect.length) / TOTAL_TRIALS,
    };
  };

  // Save results and navigate
  const saveAndContinue = async () => {
    const metrics = calculateMetrics();
    
    // TODO: Save to backend via API
    console.log("Stroop Assessment Results:", metrics);
    
    // If onComplete callback is provided, call it instead of navigating
    if (onComplete) {
      onComplete(metrics);
    } else {
      // Navigate to assessment results or next test
      setLocation("/assessment/results");
    }
  };

  if (phase === "instruction") {
    const showPracticeResults = practiceResults.length > 0;
    
    return (
      <div className="container max-w-4xl py-8">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-6">认知灵活性测试 (Stroop)</h1>
          
          {/* 交互式动画演示 */}
          <div className="mb-8">
            <StroopDemo />
          </div>
          
          <div className="space-y-4">
            <p>
              这是一个Stroop测试，用于评估您的认知灵活性和抑制干扰的能力。
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h2 className="font-semibold mb-2">测试说明：</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>屏幕上会出现一个<strong>颜色词</strong>（如"红色"）</li>
                <li>这个词会以某种<strong>颜色</strong>显示</li>
                <li>您需要<strong>忽略词的含义</strong>，只关注<strong>字体颜色</strong></li>
                <li>点击下方对应的颜色按钮</li>
                <li>尽可能快速且准确地反应</li>
                <li>测试共30次，约需2分钟</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm">
                <strong>示例：</strong>如果看到<span className="text-red-500 font-bold">绿色</span>（"绿色"这个词以红色字体显示），您应该选择<strong>红色</strong>按钮。
              </p>
            </div>
            
            {showPracticeResults && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm">
                  <strong>练习完成！</strong>您已了解测试流程。准备好后开始正式测试。
                </p>
              </div>
            )}
            
            {!showPracticeResults && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm">
                  <strong>提示：</strong>建议先完成练习试次，熟悉测试流程。
                </p>
              </div>
            )}
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm">
                <strong>重要提示：</strong>请在安静的环境中完成测试。
                测试大约需要2分钟。
              </p>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4">
            <Button onClick={() => setLocation("/assessment")} variant="outline">
              返回
            </Button>
            {!showPracticeResults && (
              <Button onClick={startPractice} variant="outline" className="flex-1">
                练习 (8次)
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
          <p className="text-lg mb-2">您已完成一半的测试！</p>
          <p className="text-muted-foreground mb-8">
            请休息片刻，准备好后继续。
          </p>
          <Button onClick={continueAfterRest} size="lg">
            继续测试
          </Button>
        </Card>
      </div>
    );
  }

  if (phase === "practice" || phase === "test") {
    const progress = (currentTrial / trials.length) * 100;
    const isPractice = phase === "practice";
    
    const getColorStyle = (color: string) => {
      const colorMap: Record<string, string> = {
        red: "text-red-500",
        green: "text-green-500",
        blue: "text-blue-500",
        yellow: "text-yellow-500",
      };
      return colorMap[color] || "";
    };
    
    return (
      <div className="container max-w-4xl py-8">
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{isPractice ? "练习" : "进度"}</span>
            <span>{currentTrial} / {trials.length}</span>
          </div>
          <Progress value={progress} />
        </div>
        
        <Card className="aspect-[4/3] flex items-center justify-center">
          {showStimulus && currentTrialData && (
            <div className={`text-8xl font-bold ${getColorStyle(currentTrialData.color)}`}>
              {COLOR_NAMES[currentTrialData.word as keyof typeof COLOR_NAMES]}
            </div>
          )}
          {!showStimulus && (
            <div className="text-6xl text-muted-foreground">+</div>
          )}
        </Card>
        
        <div className="mt-6 grid grid-cols-4 gap-4">
          {COLORS.map(color => (
            <Button
              key={color}
              onClick={() => handleColorResponse(color)}
              disabled={!waitingForResponseRef.current}
              size="lg"
              className={`h-20 text-lg font-semibold ${
                color === "red" ? "bg-red-500 hover:bg-red-600" :
                color === "green" ? "bg-green-500 hover:bg-green-600" :
                color === "blue" ? "bg-blue-500 hover:bg-blue-600" :
                "bg-yellow-500 hover:bg-yellow-600"
              }`}
            >
              {COLOR_NAMES[color as keyof typeof COLOR_NAMES]}
            </Button>
          ))}
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
                <div className="text-sm text-muted-foreground"><MetricTooltip metric="accuracy">一致条件准确率</MetricTooltip></div>
                <div className="text-2xl font-bold">{(metrics.congruentAccuracy * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground"><MetricTooltip metric="accuracy">不一致条件准确率</MetricTooltip></div>
                <div className="text-2xl font-bold">{(metrics.incongruentAccuracy * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground"><MetricTooltip metric="meanRT">一致条件反应时</MetricTooltip></div>
                <div className="text-2xl font-bold">{metrics.congruentMeanRT.toFixed(0)}ms</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground"><MetricTooltip metric="meanRT">不一致条件反应时</MetricTooltip></div>
                <div className="text-2xl font-bold">{metrics.incongruentMeanRT.toFixed(0)}ms</div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-muted-foreground mb-1"><MetricTooltip metric="stroopEffect">Stroop效应</MetricTooltip></div>
              <div className="text-3xl font-bold">{metrics.stroopEffect.toFixed(0)}ms</div>
              <div className="text-xs text-muted-foreground mt-1">
                (不一致RT - 一致RT)
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-sm text-muted-foreground mb-1">认知灵活性指数</div>
              <div className="text-3xl font-bold">{metrics.cognitiveFlexibilityIndex.toFixed(3)}</div>
            </div>
            
            <p className="text-muted-foreground">
              您的测试数据已记录。这是第4项评估测试。
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

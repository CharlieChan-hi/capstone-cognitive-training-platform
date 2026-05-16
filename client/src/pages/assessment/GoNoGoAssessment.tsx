import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GoNoGoDemo } from "@/components/assessment/GoNoGoDemo";
import { FeedbackOverlay, FeedbackType } from "@/components/assessment/FeedbackOverlay";
import { MetricTooltip } from '@/components/MetricTooltip';

/**
 * Go/No-Go Assessment - 抑制控制评估
 * 
 * 测试参数（固定，确保科学可重复性）：
 * - 总试次：30 (优化版，原60试次)
 * - Go试次：70% (21次) - 绿色圆圈
 * - No-Go试次：30% (9次) - 红色圆圈
 * - 刺激呈现时间：500ms
 * - 试次间隔（ISI）：1000-1500ms (随机)
 * - 反应窗口：1000ms
 * 
 * 记录指标：
 * - Go Accuracy (Go准确率)
 * - No-Go Accuracy (No-Go准确率)
 * - Commission Errors (冲动错误 - No-Go时按键)
 * - Omission Errors (遗漏错误 - Go时未按键)
 * - Mean Go RT (Go反应时)
 * - RT SD (反应时标准差)
 * - Inhibition Control Index (抑制控制指数)
 */

interface Trial {
  trialNumber: number;
  type: "go" | "nogo";
  stimulusOnset: number;
}

interface TrialResult {
  trialNumber: number;
  type: "go" | "nogo";
  responded: boolean;
  responseTime?: number;
  reactionTime?: number;
  correct: boolean;
  errorType?: "commission" | "omission";
}

const TOTAL_TRIALS = 30; // Reduced from 60 for better UX
const GO_RATIO = 0.7; // 70% Go trials
const STIMULUS_DURATION = 500; // ms
const ISI_MIN = 1000; // ms
const ISI_MAX = 1500; // ms
const RESPONSE_WINDOW = 1000; // ms

interface GoNoGoAssessmentProps {
  onComplete?: (results: any) => void;
}

export default function GoNoGoAssessment({ onComplete }: GoNoGoAssessmentProps = {}) {
  const [, setLocation] = useLocation();
  
  const [phase, setPhase] = useState<"instruction" | "practice" | "test" | "rest" | "complete">("instruction");
  const [currentTrial, setCurrentTrial] = useState(0);
  const [showStimulus, setShowStimulus] = useState(false);
  const [currentType, setCurrentType] = useState<"go" | "nogo" | null>(null);
  
  const [trials, setTrials] = useState<Trial[]>([]);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [practiceResults, setPracticeResults] = useState<TrialResult[]>([]);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  
  const respondedRef = useRef(false);
  const stimulusOnsetRef = useRef(0);
  const isProcessingRef = useRef(false);
  const currentTrialRef = useRef(0);
  const phaseRef = useRef<string>("instruction");
  const trialActiveRef = useRef(false);

  // Generate trials on mount
  useEffect(() => {
    const generatedTrials = generateTrials(TOTAL_TRIALS);
    setTrials(generatedTrials);
  }, []);

  // Generate trial sequence
  const generateTrials = (numTrials: number): Trial[] => {
    const goCount = Math.floor(numTrials * GO_RATIO);
    const nogoCount = numTrials - goCount;
    
    const trialList: Trial[] = [];
    
    // Create Go trials
    for (let i = 0; i < goCount; i++) {
      trialList.push({
        trialNumber: 0,
        type: "go",
        stimulusOnset: 0,
      });
    }
    
    // Create No-Go trials
    for (let i = 0; i < nogoCount; i++) {
      trialList.push({
        trialNumber: 0,
        type: "nogo",
        stimulusOnset: 0,
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

  const startPractice = () => {
    phaseRef.current = "practice";
    currentTrialRef.current = 0;
    setPhase("practice");
    setCurrentTrial(0);
    setPracticeResults([]);
    const practiceTrials = generateTrials(8);
    setTrials(practiceTrials);
    runTrial(0, true);
  };

  const startTest = () => {
    phaseRef.current = "test";
    currentTrialRef.current = 0;
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
        phaseRef.current = "instruction";
        setPhase("instruction");
      } else {
        finishTest();
      }
      return;
    }

    const trial = trials[trialIndex];
    respondedRef.current = false;
    isProcessingRef.current = false;
    trialActiveRef.current = false;

    setShowStimulus(false);
    setCurrentType(null);

    const isi = ISI_MIN + Math.random() * (ISI_MAX - ISI_MIN);

    setTimeout(() => {
      if (phaseRef.current !== "practice" && phaseRef.current !== "test") return;

      const onset = Date.now();
      stimulusOnsetRef.current = onset;

      setCurrentType(trial.type);
      setShowStimulus(true);
      trialActiveRef.current = true;

      setTimeout(() => {
        setShowStimulus(false);
        setCurrentType(null);
      }, STIMULUS_DURATION);

      setTimeout(() => {
        trialActiveRef.current = false;

        if (!respondedRef.current) {
          const result: TrialResult = {
            trialNumber: trial.trialNumber,
            type: trial.type,
            responded: false,
            correct: trial.type === "nogo",
            errorType: trial.type === "go" ? "omission" : undefined,
          };

          if (isPractice) {
            setPracticeResults(prev => [...prev, result]);
          } else {
            setResults(prev => [...prev, result]);
          }
        }

        currentTrialRef.current = trialIndex + 1;
        setCurrentTrial(trialIndex + 1);
        runTrial(trialIndex + 1, isPractice);
      }, RESPONSE_WINDOW);
    }, isi);
  };

  // Handle spacebar press
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      if (!trialActiveRef.current) return;
      if (respondedRef.current || isProcessingRef.current) return;

      isProcessingRef.current = true;
      respondedRef.current = true;
      trialActiveRef.current = false;

      const trialIndex = currentTrialRef.current;
      const responseTime = Date.now();
      const reactionTime = responseTime - stimulusOnsetRef.current;
      const trial = trials[trialIndex];
      if (!trial) return;

      const result: TrialResult = {
        trialNumber: trial.trialNumber,
        type: trial.type,
        responded: true,
        responseTime,
        reactionTime,
        correct: trial.type === "go",
        errorType: trial.type === "nogo" ? "commission" : undefined,
      };

      const isPractice = phaseRef.current === "practice";
      if (isPractice) {
        setPracticeResults(prev => [...prev, result]);
      } else {
        setResults(prev => [...prev, result]);
      }
      // runTrial's RESPONSE_WINDOW timeout handles advancing
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [trials]);

  const finishTest = () => {
    phaseRef.current = "complete";
    setPhase("complete");
  };

  // Calculate performance metrics
  const calculateMetrics = () => {
    const goTrials = results.filter(r => r.type === "go");
    const nogoTrials = results.filter(r => r.type === "nogo");
    
    const goCorrect = goTrials.filter(r => r.correct).length;
    const nogoCorrect = nogoTrials.filter(r => r.correct).length;
    
    const commissionErrors = results.filter(r => r.errorType === "commission").length;
    const omissionErrors = results.filter(r => r.errorType === "omission").length;
    
    const goAccuracy = goTrials.length > 0 ? goCorrect / goTrials.length : 0;
    const nogoAccuracy = nogoTrials.length > 0 ? nogoCorrect / nogoTrials.length : 0;
    
    // Calculate RT metrics (only for correct Go trials)
    const goRTs = results
      .filter(r => r.type === "go" && r.correct && r.reactionTime)
      .map(r => r.reactionTime!);
    
    const meanGoRT = goRTs.length > 0 ? goRTs.reduce((a, b) => a + b, 0) / goRTs.length : 0;
    const sdRT = goRTs.length > 1 ? calculateSD(goRTs) : 0;
    
    // Inhibition Control Index: (No-Go Accuracy - Commission Error Rate)
    const commissionRate = nogoTrials.length > 0 ? commissionErrors / nogoTrials.length : 0;
    const inhibitionIndex = nogoAccuracy - commissionRate;
    
    return {
      totalTrials: TOTAL_TRIALS,
      goTrials: goTrials.length,
      nogoTrials: nogoTrials.length,
      goAccuracy,
      nogoAccuracy,
      commissionErrors,
      omissionErrors,
      commissionRate,
      omissionRate: goTrials.length > 0 ? omissionErrors / goTrials.length : 0,
      meanGoRT,
      sdRT,
      inhibitionIndex,
      overallAccuracy: (goCorrect + nogoCorrect) / TOTAL_TRIALS,
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
           <h1 className="text-3xl font-bold mb-6">Go/No-Go 抑制控制测试</h1>
          
          {/* 交互式动画演示 */}
          <div className="mb-8">
            <GoNoGoDemo />
          </div>
          
          <div className="space-y-4">
            <p>
              这是一个抑制控制测试，用于评估您抑制冲动反应的能力。
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h2 className="font-semibold mb-2">测试说明：</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>屏幕上会出现<strong className="text-green-600">绿色圆圈</strong>或<strong className="text-red-600">红色圆圈</strong></li>
                <li><strong className="text-green-600">绿色圆圈 (Go)</strong>：立即按空格键</li>
                <li><strong className="text-red-600">红色圆圈 (No-Go)</strong>：不要按键，抑制反应</li>
                <li>需要快速反应，但也要控制冲动</li>
                <li>测试共30次，约需1.5分钟</li>
              </ul>
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
                测试大约需要1.5分钟。
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
    
    return (
      <div className="container max-w-4xl py-8">
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{isPractice ? "练习" : "进度"}</span>
            <span>{currentTrial} / {trials.length}</span>
          </div>
          <Progress value={progress} />
        </div>
        
        <Card className="aspect-square flex items-center justify-center">
          {showStimulus && currentType && (
            <div 
              className={`w-48 h-48 rounded-full transition-all duration-100 ${
                currentType === "go" 
                  ? "bg-green-500" 
                  : "bg-red-500"
              }`}
            />
          )}
          {!showStimulus && (
            <div className="text-6xl text-muted-foreground">+</div>
          )}
        </Card>
        
        <div className="mt-6 text-center space-y-2">
          <div className="flex justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-500"></div>
              <span className="text-muted-foreground">按空格键</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-500"></div>
              <span className="text-muted-foreground">不要按键</span>
            </div>
          </div>
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
                <div className="text-sm text-muted-foreground"><MetricTooltip metric="hitRate">Go准确率</MetricTooltip></div>
                <div className="text-2xl font-bold">{(metrics.goAccuracy * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground"><MetricTooltip metric="falseAlarmRate">No-Go准确率</MetricTooltip></div>
                <div className="text-2xl font-bold">{(metrics.nogoAccuracy * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">冲动错误</div>
                <div className="text-2xl font-bold">{metrics.commissionErrors}</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground"><MetricTooltip metric="meanRT">平均反应时</MetricTooltip></div>
                <div className="text-2xl font-bold">{metrics.meanGoRT.toFixed(0)}ms</div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-muted-foreground mb-1">抑制控制指数</div>
              <div className="text-3xl font-bold">{metrics.inhibitionIndex.toFixed(3)}</div>
            </div>
            
            <p className="text-muted-foreground">
              您的测试数据已记录。这是最后一项核心评估测试。
            </p>
          </div>
          
          <div className="mt-8">
            <Button onClick={saveAndContinue} className="w-full" size="lg">
              查看评估报告
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}

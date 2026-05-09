import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { NBackDemo } from "@/components/assessment/NBackDemo";
import { FeedbackOverlay, FeedbackType } from "@/components/assessment/FeedbackOverlay";
import { MetricTooltip } from '@/components/MetricTooltip';

/**
 * N-back Test - 工作记忆测试
 * 
 * 测试参数（固定，确保科学可重复性）：
 * - N值：2 (2-back任务)
 * - 总试次：20 (优化版，原40试次)
 * - 匹配试次：30% (6次)
 * - 非匹配试次：70% (14次)
 * - 刺激呈现时间：500ms
 * - 试次间隔（ISI）：2000ms
 * - 反应窗口：2000ms
 * - 刺激类型：数字1-9
 * 
 * 记录指标：
 * - Hit Rate (命中率)
 * - False Alarm Rate (虚报率)
 * - Accuracy (准确率)
 * - Mean RT (平均反应时)
 * - RT SD (反应时标准差)
 * - Working Memory Capacity (工作记忆容量估计)
 */

interface Trial {
  trialNumber: number;
  stimulus: number;
  isMatch: boolean; // Whether it matches the stimulus N trials back
}

interface TrialResult {
  trialNumber: number;
  stimulus: number;
  isMatch: boolean;
  responded: boolean;
  responseTime?: number;
  reactionTime?: number;
  correct: boolean;
  responseType: "hit" | "miss" | "false_alarm" | "correct_rejection";
}

const N_BACK = 2;
const TOTAL_TRIALS = 20; // Reduced from 40 for better UX
const MATCH_RATIO = 0.3; // 30% matches
const STIMULUS_DURATION = 500; // ms
const ISI = 2000; // Inter-stimulus interval
const RESPONSE_WINDOW = 2000; // ms
const STIMULI = [1, 2, 3, 4, 5, 6, 7, 8, 9];

interface NBackTestProps {
  onComplete?: (results: any) => void;
}

export default function NBackTest({ onComplete }: NBackTestProps = {}) {
  const [, setLocation] = useLocation();
  
  const [phase, setPhase] = useState<"instruction" | "practice" | "test" | "complete">("instruction");
  const [currentTrial, setCurrentTrial] = useState(0);
  const [showStimulus, setShowStimulus] = useState(false);
  const [currentStimulus, setCurrentStimulus] = useState<number | null>(null);
  
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

  // Generate trial sequence with controlled matches
  const generateTrials = (numTrials: number): Trial[] => {
    const trialList: Trial[] = [];
    const matchCount = Math.floor(numTrials * MATCH_RATIO);
    
    // Initialize first N trials (cannot be matches)
    for (let i = 0; i < N_BACK; i++) {
      const stimulus = STIMULI[Math.floor(Math.random() * STIMULI.length)];
      trialList.push({
        trialNumber: i + 1,
        stimulus,
        isMatch: false,
      });
    }
    
    // Determine which trials will be matches
    const matchPositions = new Set<number>();
    while (matchPositions.size < matchCount) {
      const pos = N_BACK + Math.floor(Math.random() * (numTrials - N_BACK));
      matchPositions.add(pos);
    }
    
    // Generate remaining trials
    for (let i = N_BACK; i < numTrials; i++) {
      let stimulus: number;
      
      if (matchPositions.has(i)) {
        // This should be a match - use the stimulus from N trials back
        stimulus = trialList[i - N_BACK].stimulus;
      } else {
        // This should not be a match - choose a different stimulus
        const previousStimulus = trialList[i - N_BACK].stimulus;
        const availableStimuli = STIMULI.filter(s => s !== previousStimulus);
        stimulus = availableStimuli[Math.floor(Math.random() * availableStimuli.length)];
      }
      
      trialList.push({
        trialNumber: i + 1,
        stimulus,
        isMatch: matchPositions.has(i),
      });
    }
    
    return trialList;
  };

  // Start practice
  const startPractice = () => {
    phaseRef.current = "practice";
    currentTrialRef.current = 0;
    setPhase("practice");
    setCurrentTrial(0);
    setPracticeResults([]);
    const practiceTrials = generateTrials(5);
    setTrials(practiceTrials);
    runTrial(0, true);
  };

  // Start actual test
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
    setCurrentStimulus(null);

    setTimeout(() => {
      if (phaseRef.current !== "practice" && phaseRef.current !== "test") return;

      const onset = Date.now();
      stimulusOnsetRef.current = onset;

      setCurrentStimulus(trial.stimulus);
      setShowStimulus(true);
      trialActiveRef.current = true;

      setTimeout(() => {
        setShowStimulus(false);
        setCurrentStimulus(null);
      }, STIMULUS_DURATION);

      setTimeout(() => {
        trialActiveRef.current = false;

        if (!respondedRef.current) {
          const result: TrialResult = {
            trialNumber: trial.trialNumber,
            stimulus: trial.stimulus,
            isMatch: trial.isMatch,
            responded: false,
            correct: !trial.isMatch,
            responseType: trial.isMatch ? "miss" : "correct_rejection",
          };

          if (isPractice) {
            setPracticeResults(prev => [...prev, result]);
          } else {
            setResults(prev => [...prev, result]);
          }

          if (trial.isMatch) {
            setFeedback("miss");
          }

          setTimeout(() => {
            setFeedback(null);
            currentTrialRef.current = trialIndex + 1;
            setCurrentTrial(trialIndex + 1);
            runTrial(trialIndex + 1, isPractice);
          }, trial.isMatch ? 500 : 0);
        } else {
          setTimeout(() => {
            setFeedback(null);
            currentTrialRef.current = trialIndex + 1;
            setCurrentTrial(trialIndex + 1);
            runTrial(trialIndex + 1, isPractice);
          }, 300);
        }
      }, RESPONSE_WINDOW);
    }, ISI);
  };

  // Handle keyboard input
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
        stimulus: trial.stimulus,
        isMatch: trial.isMatch,
        responded: true,
        responseTime,
        reactionTime,
        correct: trial.isMatch,
        responseType: trial.isMatch ? "hit" : "false_alarm",
      };

      const isPractice = phaseRef.current === "practice";
      if (isPractice) {
        setPracticeResults(prev => [...prev, result]);
      } else {
        setResults(prev => [...prev, result]);
      }

      setFeedback(trial.isMatch ? "correct" : "incorrect");
      // runTrial's RESPONSE_WINDOW timeout will handle advancing
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
    const hits = results.filter(r => r.responseType === "hit").length;
    const misses = results.filter(r => r.responseType === "miss").length;
    const falseAlarms = results.filter(r => r.responseType === "false_alarm").length;
    const correctRejections = results.filter(r => r.responseType === "correct_rejection").length;
    
    const matchTrials = hits + misses;
    const nonMatchTrials = falseAlarms + correctRejections;
    
    const hitRate = matchTrials > 0 ? hits / matchTrials : 0;
    const falseAlarmRate = nonMatchTrials > 0 ? falseAlarms / nonMatchTrials : 0;
    
    // Calculate accuracy
    const accuracy = (hits + correctRejections) / TOTAL_TRIALS;
    
    // Estimate working memory capacity using Cowan's K formula
    // K = n * (H - F) where n = set size, H = hit rate, F = false alarm rate
    const workingMemoryCapacity = N_BACK * (hitRate - falseAlarmRate);
    
    // Calculate RT metrics (only for hits)
    const hitRTs = results
      .filter(r => r.responseType === "hit" && r.reactionTime)
      .map(r => r.reactionTime!);
    
    const meanRT = hitRTs.length > 0 ? hitRTs.reduce((a, b) => a + b, 0) / hitRTs.length : 0;
    const sdRT = hitRTs.length > 1 ? calculateSD(hitRTs) : 0;
    
    return {
      totalTrials: TOTAL_TRIALS,
      matchTrials,
      nonMatchTrials,
      hits,
      misses,
      falseAlarms,
      correctRejections,
      hitRate,
      falseAlarmRate,
      accuracy,
      workingMemoryCapacity,
      meanRT,
      sdRT,
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
    console.log("N-back Test Results:", metrics);
    
    // If onComplete callback is provided, call it instead of navigating
    if (onComplete) {
      onComplete(metrics);
    } else {
      // Navigate to next assessment
      setLocation("/assessment/gonogo");
    }
  };

  if (phase === "instruction") {
    const showPracticeResults = practiceResults.length > 0;
    
    return (
      <div className="container max-w-4xl py-8">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-6">工作记忆测试 (N-back)</h1>
          
          {/* 交互式动画演示 */}
          <div className="mb-8">
            <NBackDemo />
          </div>
          
          <div className="space-y-4">
            <p>
              这是一个工作记忆测试，用于评估您在脑海中暂时保持和操作信息的能力。
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h2 className="font-semibold mb-2">测试说明：</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>屏幕上会依次出现数字（1-9）</li>
                <li><strong>当前数字与前2个数字相同时，按空格键</strong></li>
                <li>例如：看到序列 "3 → 7 → 3"，在第二个3出现时按键</li>
                <li>需要记住最近的2个数字</li>
                <li>测试共40次，请保持专注</li>
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
                <strong>重要提示：</strong>这个测试需要高度集中注意力。
                请在安静的环境中完成，测试大约需要2-3分钟。
              </p>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4">
            <Button onClick={() => setLocation("/assessment")} variant="outline">
              返回
            </Button>
            {!showPracticeResults && (
              <Button onClick={startPractice} variant="outline" className="flex-1">
                练习 (5次)
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
          <div className={`text-9xl font-bold transition-opacity duration-100 ${
            showStimulus ? "opacity-100" : "opacity-30"
          }`}>
            {showStimulus ? currentStimulus : "+"}
          </div>
        </Card>
        
        <div className="mt-6 text-center text-muted-foreground">
          <p className="text-lg">当前数字与前2个数字相同时按空格键</p>
          <p className="text-sm mt-2">记住最近的2个数字</p>
        </div>
        
        <FeedbackOverlay feedback={feedback} onComplete={() => setFeedback(null)} />
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
                <div className="text-sm text-muted-foreground"><MetricTooltip metric="accuracy">准确率</MetricTooltip></div>
                <div className="text-2xl font-bold">{(metrics.accuracy * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground"><MetricTooltip metric="hitRate">命中率</MetricTooltip></div>
                <div className="text-2xl font-bold">{(metrics.hitRate * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">工作记忆容量</div>
                <div className="text-2xl font-bold">{metrics.workingMemoryCapacity.toFixed(2)}</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground"><MetricTooltip metric="meanRT">平均反应时</MetricTooltip></div>
                <div className="text-2xl font-bold">{metrics.meanRT.toFixed(0)}ms</div>
              </div>
            </div>
            
            <p className="text-muted-foreground">
              您的测试数据已记录。点击继续进行下一项评估。
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

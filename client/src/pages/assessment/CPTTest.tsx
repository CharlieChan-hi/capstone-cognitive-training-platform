import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CPTDemo } from "@/components/assessment/CPTDemo";
import { FeedbackOverlay, FeedbackType } from "@/components/assessment/FeedbackOverlay";
import { calculateDPrime as calculateDPrimeUtil, calculateCriterion as calculateCriterionUtil } from "@/lib/sdtUtils";
import { MetricTooltip } from '@/components/MetricTooltip';

/**
 * CPT (Continuous Performance Test) - 持续注意力测试
 * 
 * 测试参数（固定，确保科学可重复性）：
 * - 总试次：30 (优化版，原80试次)
 * - 目标刺激（X）：20% (6次)
 * - 非目标刺激（其他字母）：80% (24次)
 * - 刺激呈现时间：250ms
 * - 试次间隔（ISI）：1500ms
 * - 反应窗口：1000ms
 * 
 * 记录指标：
 * - Hit Rate (命中率)
 * - False Alarm Rate (虚报率)
 * - Mean RT (平均反应时)
 * - RT SD (反应时标准差)
 * - d-prime (信号检测敏感度)
 * - criterion (反应偏向)
 */

interface Trial {
  trialNumber: number;
  stimulus: string;
  isTarget: boolean;
  stimulusOnset: number;
}

interface TrialResult {
  trialNumber: number;
  stimulus: string;
  isTarget: boolean;
  responded: boolean;
  responseTime?: number;
  reactionTime?: number;
  correct: boolean;
  responseType: "hit" | "miss" | "false_alarm" | "correct_rejection";
}

const TOTAL_TRIALS = 30; // Reduced from 80 for better UX
const TARGET_RATIO = 0.2; // 20% targets
const STIMULUS_DURATION = 250; // ms
const ISI = 1500; // Inter-stimulus interval
const RESPONSE_WINDOW = 1000; // ms
const TARGET_STIMULUS = "X";
const NON_TARGET_STIMULI = ["A", "B", "C", "D", "E", "F", "G", "H"];

interface CPTTestProps {
  onComplete?: (results: any) => void;
}

export default function CPTTest({ onComplete }: CPTTestProps = {}) {
  const [, setLocation] = useLocation();
  
  const [phase, setPhase] = useState<"instruction" | "test" | "rest" | "complete">("instruction");
  const [currentTrial, setCurrentTrial] = useState(0);
  const [showStimulus, setShowStimulus] = useState(false);
  const [currentStimulus, setCurrentStimulus] = useState("");
  
  const [trials, setTrials] = useState<Trial[]>([]);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  
  const respondedRef = useRef(false);
  const trialStartTimeRef = useRef(0);
  const stimulusOnsetRef = useRef(0);
  const isProcessingRef = useRef(false);
  const currentTrialRef = useRef(0);
  const phaseRef = useRef<string>("instruction");
  const trialActiveRef = useRef(false); // Only true during response window

  // Generate trials on mount
  useEffect(() => {
    const generatedTrials = generateTrials();
    setTrials(generatedTrials);
  }, []);

  // Generate trial sequence
  const generateTrials = (): Trial[] => {
    const targetCount = Math.floor(TOTAL_TRIALS * TARGET_RATIO);
    const nonTargetCount = TOTAL_TRIALS - targetCount;
    
    const trialList: Trial[] = [];
    
    // Create target trials
    for (let i = 0; i < targetCount; i++) {
      trialList.push({
        trialNumber: 0, // Will be set later
        stimulus: TARGET_STIMULUS,
        isTarget: true,
        stimulusOnset: 0,
      });
    }
    
    // Create non-target trials
    for (let i = 0; i < nonTargetCount; i++) {
      const randomStimulus = NON_TARGET_STIMULI[Math.floor(Math.random() * NON_TARGET_STIMULI.length)];
      trialList.push({
        trialNumber: 0,
        stimulus: randomStimulus,
        isTarget: false,
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

  // Start test
  const startTest = () => {
    phaseRef.current = "test";
    currentTrialRef.current = 0;
    setPhase("test");
    setCurrentTrial(0);
    setResults([]);
    runTrial(0);
  };

  // Run a single trial
  const runTrial = (trialIndex: number) => {
    if (trialIndex >= trials.length) {
      finishTest();
      return;
    }

    const trial = trials[trialIndex];
    respondedRef.current = false;
    isProcessingRef.current = false;
    trialActiveRef.current = false; // NOT accepting input during ISI

    // Show fixation (+) first
    setShowStimulus(false);
    setCurrentStimulus("+");

    // After ISI, show stimulus
    setTimeout(() => {
      if (phaseRef.current !== "test") return;

      const onset = Date.now();
      stimulusOnsetRef.current = onset;
      trialStartTimeRef.current = onset;

      setCurrentStimulus(trial.stimulus);
      setShowStimulus(true);
      trialActiveRef.current = true; // NOW accepting input

      // Hide stimulus after STIMULUS_DURATION
      setTimeout(() => {
        setShowStimulus(false);
        setCurrentStimulus("+");
      }, STIMULUS_DURATION);

      // Check for response after RESPONSE_WINDOW
      setTimeout(() => {
        trialActiveRef.current = false;

        if (!respondedRef.current) {
          // No response — record miss or correct rejection
          const result: TrialResult = {
            trialNumber: trial.trialNumber,
            stimulus: trial.stimulus,
            isTarget: trial.isTarget,
            responded: false,
            correct: !trial.isTarget,
            responseType: trial.isTarget ? "miss" : "correct_rejection",
          };

          setResults(prev => [...prev, result]);

          if (trial.isTarget) {
            setFeedback("miss");
          }

          setTimeout(() => {
            setFeedback(null);
            currentTrialRef.current = trialIndex + 1;
            setCurrentTrial(trialIndex + 1);
            runTrial(trialIndex + 1);
          }, trial.isTarget ? 500 : 0);
        } else {
          // User already responded — clear feedback and advance
          setTimeout(() => {
            setFeedback(null);
            currentTrialRef.current = trialIndex + 1;
            setCurrentTrial(trialIndex + 1);
            runTrial(trialIndex + 1);
          }, 300);
        }
      }, RESPONSE_WINDOW);
    }, ISI);
  };

  // Handle spacebar press
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      if (!trialActiveRef.current) return; // Only during response window
      if (respondedRef.current || isProcessingRef.current) return;

      isProcessingRef.current = true;
      respondedRef.current = true;
      trialActiveRef.current = false; // Consumed this trial's input

      const trialIndex = currentTrialRef.current;
      const responseTime = Date.now();
      const reactionTime = responseTime - stimulusOnsetRef.current;
      const trial = trials[trialIndex];
      if (!trial) return;

      const result: TrialResult = {
        trialNumber: trial.trialNumber,
        stimulus: trial.stimulus,
        isTarget: trial.isTarget,
        responded: true,
        responseTime,
        reactionTime,
        correct: trial.isTarget,
        responseType: trial.isTarget ? "hit" : "false_alarm",
      };

      setResults(prev => [...prev, result]);
      setFeedback(trial.isTarget ? "correct" : "incorrect");

      // The RESPONSE_WINDOW timeout in runTrial will see respondedRef=true
      // and skip its logic, so we just need to wait for it, then advance.
      // Don't advance here — let runTrial's timeout handle the transition.
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [trials]);

  // Continue after rest
  const continueAfterRest = () => {
    setPhase("test");
    runTrial(currentTrial);
  };

  // Finish test and calculate metrics
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
    
    const targetTrials = hits + misses;
    const nonTargetTrials = falseAlarms + correctRejections;
    
    const hitRate = targetTrials > 0 ? hits / targetTrials : 0;
    const falseAlarmRate = nonTargetTrials > 0 ? falseAlarms / nonTargetTrials : 0;
    
    // Calculate d-prime (signal detection sensitivity)
    const dPrime = calculateDPrimeUtil(hitRate, falseAlarmRate);

    // Calculate criterion (response bias)
    const criterion = calculateCriterionUtil(hitRate, falseAlarmRate);
    
    // Calculate RT metrics (only for hits)
    const hitRTs = results
      .filter(r => r.responseType === "hit" && r.reactionTime)
      .map(r => r.reactionTime!);
    
    const meanRT = hitRTs.length > 0 ? hitRTs.reduce((a, b) => a + b, 0) / hitRTs.length : 0;
    const sdRT = hitRTs.length > 1 ? calculateSD(hitRTs) : 0;
    
    return {
      totalTrials: TOTAL_TRIALS,
      targetTrials,
      nonTargetTrials,
      hits,
      misses,
      falseAlarms,
      correctRejections,
      hitRate,
      falseAlarmRate,
      dPrime,
      criterion,
      meanRT,
      sdRT,
      accuracy: (hits + correctRejections) / TOTAL_TRIALS,
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
      // Navigate to next assessment or results page
      setLocation("/assessment/results");
    }
  };

  if (phase === "instruction") {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-6">持续注意力测试 (CPT)</h1>
          
          {/* 交互式动画演示 */}
          <div className="mb-8">
            <CPTDemo />
          </div>
          
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h2 className="font-semibold mb-2">测试说明：</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>屏幕上会快速出现不同的字母</li>
                <li><strong>只有当看到字母 “X” 时，才按空格键</strong></li>
                <li>看到其他字母时，<strong>不要按键</strong></li>
                <li>字母会快速闪现，请保持专注</li>
                <li>测试共30次，约需2分钟</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm">
                <strong>重要提示：</strong>请在安静的环境中完成测试，确保不会被打扰。
              </p>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4">
            <Button onClick={() => setLocation("/app/assessment")} variant="outline">
              返回
            </Button>
            <Button onClick={startTest} className="flex-1" size="lg">
              开始测试
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

  if (phase === "test") {
    const progress = (currentTrial / TOTAL_TRIALS) * 100;
    
    return (
      <div className="container max-w-4xl py-8">
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>进度</span>
            <span>{currentTrial} / {TOTAL_TRIALS}</span>
          </div>
          <Progress value={progress} />
        </div>
        
        <Card className="aspect-square flex items-center justify-center">
          <div className={`text-9xl font-bold transition-opacity duration-100 ${
            showStimulus ? "opacity-100" : "opacity-50"
          }`}>
            {currentStimulus}
          </div>
        </Card>
        
        <div className="mt-6 text-center text-muted-foreground">
          <p>看到 "X" 时按空格键</p>
          <p className="text-sm mt-2">其他字母不要按键</p>
        </div>
        
        {/* Immediate feedback overlay */}
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
                <div className="text-sm text-muted-foreground"><MetricTooltip metric="hitRate">命中率</MetricTooltip></div>
                <div className="text-2xl font-bold">{(metrics.hitRate * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground"><MetricTooltip metric="falseAlarmRate">虚报率</MetricTooltip></div>
                <div className="text-2xl font-bold">{(metrics.falseAlarmRate * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground"><MetricTooltip metric="dPrime">敏感度 (d')</MetricTooltip></div>
                <div className="text-2xl font-bold">{metrics.dPrime.toFixed(2)}</div>
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

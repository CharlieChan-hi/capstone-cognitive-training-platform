import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, Brain, Zap, Target, Palette, Grid3x3, Image as ImageIcon } from "lucide-react";
import CPTTest from "@/pages/assessment/CPTTest";
import NBackTest from "@/pages/assessment/NBackTest";
import GoNoGoAssessment from "@/pages/assessment/GoNoGoAssessment";
import StroopAssessment from "@/pages/assessment/StroopAssessment";
import AttentionSpanTest from "@/pages/assessment/AttentionSpanTest";
import VisualMemoryTest from "@/pages/assessment/VisualMemoryTest";

// 定义测试配置
const ASSESSMENT_TESTS = [
  {
    id: "cpt",
    name: "CPT持续注意力测试",
    description: "评估您持续关注目标刺激的能力，测试约5分钟",
    icon: Target,
    duration: "约5分钟",
    component: CPTTest,
  },
  {
    id: "nback",
    name: "N-back工作记忆测试",
    description: "评估您的工作记忆容量和信息更新能力，测试约4分钟",
    icon: Brain,
    duration: "约4分钟",
    component: NBackTest,
  },
  {
    id: "gonogo",
    name: "Go/No-Go抑制控制测试",
    description: "评估您抑制冲动反应的能力，测试约3分钟",
    icon: Zap,
    duration: "约3分钟",
    component: GoNoGoAssessment,
  },
  {
    id: "stroop",
    name: "Stroop认知灵活性测试",
    description: "评估您在干扰条件下的认知灵活性，测试约3分钟",
    icon: Palette,
    duration: "约3分钟",
    component: StroopAssessment,
  },
  {
    id: "attention-span",
    name: "注意广度测试",
    description: "评估您的视觉搜索和注意广度能力，测试约5分钟",
    icon: Grid3x3,
    duration: "约5分钟",
    component: AttentionSpanTest,
  },
  {
    id: "visual-memory",
    name: "视觉空间记忆测试",
    description: "评估您的视觉记忆和空间定位能力，测试约3分钟",
    icon: ImageIcon,
    duration: "约3分钟",
    component: VisualMemoryTest,
  },
];

type AssessmentStage = "intro" | "testing" | "rest" | "complete";

export default function BaselineAssessment() {
  const [, setLocation] = useLocation();
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [stage, setStage] = useState<AssessmentStage>("intro");
  const [completedTests, setCompletedTests] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // 从localStorage恢复进度
  useEffect(() => {
    const savedProgress = localStorage.getItem("assessment_progress");
    if (savedProgress) {
      try {
        const { currentTestIndex: savedIndex, completedTests: savedCompleted, testResults: savedResults } = JSON.parse(savedProgress);
        setCurrentTestIndex(savedIndex);
        setCompletedTests(savedCompleted);
        setTestResults(savedResults);
        if (savedIndex < ASSESSMENT_TESTS.length) {
          setStage("intro");
        } else {
          setStage("complete");
        }
      } catch (e) {
        console.error("Failed to restore assessment progress:", e);
      }
    }
  }, []);

  // 保存进度到localStorage
  const saveProgress = (index: number, completed: string[], results: Record<string, any>) => {
    localStorage.setItem(
      "assessment_progress",
      JSON.stringify({
        currentTestIndex: index,
        completedTests: completed,
        testResults: results,
      })
    );
  };

  const currentTest = ASSESSMENT_TESTS[currentTestIndex];
  const progress = (completedTests.length / ASSESSMENT_TESTS.length) * 100;

  const handleStartTest = () => {
    setStage("testing");
  };

  const handleTestComplete = (results: any) => {
    const newCompleted = [...completedTests, currentTest.id];
    const newResults = { ...testResults, [currentTest.id]: results };
    
    setCompletedTests(newCompleted);
    setTestResults(newResults);

    // 检查是否完成所有测试
    if (currentTestIndex === ASSESSMENT_TESTS.length - 1) {
      setStage("complete");
      saveProgress(currentTestIndex + 1, newCompleted, newResults);
      // TODO: 提交评估结果到后端
      console.log("All tests completed:", newResults);
    } else {
      saveProgress(currentTestIndex + 1, newCompleted, newResults);
      setTimeout(() => {
        setCurrentTestIndex(currentTestIndex + 1);
        setStage("intro");
      }, 2000);
    }
  };

  const handleNextTest = () => {
    setCurrentTestIndex(currentTestIndex + 1);
    setStage("intro");
  };

  const handleFinishAssessment = () => {
    // 不清除进度，评估报告页面需要读取
    // 跳转到评估报告页面
    setLocation("/app/assessment/report");
  };

  // 渲染完成页面
  if (stage === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 flex items-center justify-center">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl">🎉 评估完成！</CardTitle>
            <CardDescription className="text-lg mt-2">
              恭喜您完成了所有6项认知能力评估测试
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 leading-relaxed">
                您已经完成了包括持续注意力、工作记忆、抑制控制、认知灵活性、注意广度和视觉记忆在内的全面认知评估。
                系统正在为您生成详细的评估报告，包括各维度的标准化分数、能力雷达图和个性化训练建议。
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-700">已完成的测试：</h3>
              <div className="grid grid-cols-2 gap-2">
                {ASSESSMENT_TESTS.map((test) => {
                  const Icon = test.icon;
                  return (
                    <div key={test.id} className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <Icon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{test.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleFinishAssessment} className="w-full" size="lg">
                查看评估报告
              </Button>
              <p className="text-xs text-center text-gray-500 mt-2">
                建议在7天后进行再次评估，以量化训练效果
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 渲染休息页面
  if (stage === "rest") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 flex items-center justify-center">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">测试完成，休息一下</CardTitle>
            <CardDescription className="text-base mt-2">
              您已完成 {completedTests.length}/{ASSESSMENT_TESTS.length} 项测试
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={progress} className="h-2" />

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">刚才完成的测试：</p>
                  <p className="text-sm text-green-700 mt-1">{currentTest.name}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 leading-relaxed">
                💡 <strong>建议休息1-2分钟</strong>，让大脑放松一下。您可以：
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-6 list-disc">
                <li>闭眼深呼吸几次</li>
                <li>站起来活动一下身体</li>
                <li>喝口水，放松眼睛</li>
              </ul>
            </div>

            {currentTestIndex < ASSESSMENT_TESTS.length - 1 && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">下一个测试：</p>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {(() => {
                    const NextIcon = ASSESSMENT_TESTS[currentTestIndex + 1].icon;
                    return <NextIcon className="w-5 h-5 text-gray-600" />;
                  })()}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{ASSESSMENT_TESTS[currentTestIndex + 1].name}</p>
                    <p className="text-xs text-gray-500">{ASSESSMENT_TESTS[currentTestIndex + 1].duration}</p>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleNextTest} className="w-full" size="lg">
              准备好了，继续下一个测试
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 渲染测试进行中
  if (stage === "testing") {
    const TestComponent = currentTest.component;
    return <TestComponent onComplete={handleTestComplete} />;
  }

  // 渲染测试介绍页面（默认）
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 flex items-center justify-center">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="text-sm">
              测试 {currentTestIndex + 1}/{ASSESSMENT_TESTS.length}
            </Badge>
            <span className="text-sm text-gray-500">
              已完成 {completedTests.length} 项
            </span>
          </div>
          <Progress value={progress} className="h-2 mb-4" />
          
          <div className="flex items-center gap-3 mb-2">
            {(() => {
              const Icon = currentTest.icon;
              return (
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
              );
            })()}
            <div>
              <CardTitle className="text-2xl">{currentTest.name}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {currentTest.duration}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed">
              {currentTest.description}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">测试说明：</h3>
            {currentTest.id === "cpt" && (
              <ul className="text-sm text-gray-600 space-y-2 ml-4 list-disc">
                <li>屏幕上会快速出现字母，当看到字母 <strong>X</strong> 时，请按<strong>空格键</strong></li>
                <li>看到其他字母时，<strong>不要按键</strong></li>
                <li>先进行10次练习，然后是80次正式测试</li>
                <li>请保持专注，尽可能快速准确地反应</li>
              </ul>
            )}
            {currentTest.id === "nback" && (
              <ul className="text-sm text-gray-600 space-y-2 ml-4 list-disc">
                <li>屏幕上会依次出现字母，当当前字母与<strong>前2个字母</strong>相同时，请按<strong>空格键</strong></li>
                <li>例如：A → B → A（此时按空格，因为当前A与前2个字母A相同）</li>
                <li>先进行8次练习，然后是40次正式测试</li>
                <li>需要记住前2个字母，考验工作记忆能力</li>
              </ul>
            )}
            {currentTest.id === "gonogo" && (
              <ul className="text-sm text-gray-600 space-y-2 ml-4 list-disc">
                <li>看到<strong>绿色圆形</strong>时，请按<strong>空格键</strong>（Go）</li>
                <li>看到<strong>红色方形</strong>时，<strong>不要按键</strong>（No-Go）</li>
                <li>先进行12次练习，然后是60次正式测试</li>
                <li>考验您抑制冲动反应的能力</li>
              </ul>
            )}
            {currentTest.id === "stroop" && (
              <ul className="text-sm text-gray-600 space-y-2 ml-4 list-disc">
                <li>屏幕上会显示颜色词（如"红色"），用不同颜色显示</li>
                <li>请按键盘上的<strong>R（红）、G（绿）、B（蓝）、Y（黄）</strong>键，选择<strong>文字的颜色</strong>（不是文字的意思）</li>
                <li>例如：看到红色显示的"绿色"，应该按R键（因为文字是红色的）</li>
                <li>先进行12次练习，然后是60次正式测试</li>
              </ul>
            )}
            {currentTest.id === "attention-span" && (
              <ul className="text-sm text-gray-600 space-y-2 ml-4 list-disc">
                <li>屏幕上会显示5×5的数字网格（1-25）</li>
                <li>请按照从<strong>1到25的顺序</strong>依次点击数字</li>
                <li>先进行1次3×3练习，然后是3轮5×5正式测试</li>
                <li>尽可能快速准确地完成，考验视觉搜索能力</li>
              </ul>
            )}
            {currentTest.id === "visual-memory" && (
              <ul className="text-sm text-gray-600 space-y-2 ml-4 list-disc">
                <li>屏幕上会显示4×4的卡片网格（16张卡片，8对图案）</li>
                <li>点击卡片翻开，找到<strong>相同图案的两张卡片</strong></li>
                <li>先进行1次2×3练习，然后是1次4×4正式测试</li>
                <li>尽量用最少的翻牌次数完成，考验视觉记忆能力</li>
              </ul>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <p className="text-sm text-amber-900">
              ⚠️ <strong>重要提示：</strong>测试过程中请保持专注，避免干扰。测试数据将用于生成您的认知能力基线评估报告。
            </p>
          </div>

          <Button onClick={handleStartTest} className="w-full" size="lg">
            开始测试
          </Button>

          {completedTests.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                已完成的测试：
                {ASSESSMENT_TESTS.filter((t) => completedTests.includes(t.id))
                  .map((t) => t.name.split("测试")[0])
                  .join("、")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

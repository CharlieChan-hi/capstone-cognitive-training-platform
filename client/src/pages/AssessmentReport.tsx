import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Brain, Target, Zap, Palette, Grid3x3, Image as ImageIcon, TrendingUp, Award, AlertCircle } from "lucide-react";

// 定义认知维度
interface CognitiveDimension {
  id: string;
  name: string;
  shortName: string;
  icon: any;
  score: number;
  level: "excellent" | "good" | "fair" | "needs_improvement";
  description: string;
}

// 定义测试结果接口
interface AssessmentResults {
  cpt: any;
  nback: any;
  gonogo: any;
  stroop: any;
  "attention-span": any;
  "visual-memory": any;
}

export default function AssessmentReport() {
  const [, setLocation] = useLocation();
  const [dimensions, setDimensions] = useState<CognitiveDimension[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const { data: savedAssessments, isLoading: assessmentsLoading } = trpc.assessment.list.useQuery();
  const latestAssessmentId = savedAssessments?.[0]?.id;
  const { data: latestAssessment } = trpc.assessment.get.useQuery(
    { assessmentId: latestAssessmentId ?? 0 },
    { enabled: !!latestAssessmentId },
  );

  useEffect(() => {
    // Prefer the local draft for the current browser, then use the
    // authenticated user's server copy for cross-device access.
    const savedProgress = localStorage.getItem("assessment_progress");
    if (!savedProgress && assessmentsLoading) return;
    if (!savedProgress && latestAssessment) {
      const testResults = Object.fromEntries(
        latestAssessment.tasks.map(task => [task.taskType, task.taskMetrics]),
      );
      const calculatedDimensions = calculateDimensions(testResults as unknown as AssessmentResults);
      setDimensions(calculatedDimensions);
      setRadarData(calculatedDimensions.map(d => ({ dimension: d.shortName, score: d.score, fullMark: 100 })));
      setOverallScore(Math.round(calculatedDimensions.reduce((sum, d) => sum + d.score, 0) / calculatedDimensions.length));
      return;
    }
    if (!savedProgress) {
      // 如果没有评估结果，跳转到评估页面
      setLocation("/app/assessment");
      return;
    }

    try {
      const { testResults } = JSON.parse(savedProgress);
      const calculatedDimensions = calculateDimensions(testResults);
      setDimensions(calculatedDimensions);
      
      // 准备雷达图数据
      const radarChartData = calculatedDimensions.map(d => ({
        dimension: d.shortName,
        score: d.score,
        fullMark: 100,
      }));
      setRadarData(radarChartData);

      // 计算总分
      const avgScore = calculatedDimensions.reduce((sum, d) => sum + d.score, 0) / calculatedDimensions.length;
      setOverallScore(Math.round(avgScore));
    } catch (e) {
      console.error("Failed to parse assessment results:", e);
      setLocation("/app/assessment");
    }
  }, [assessmentsLoading, latestAssessment, setLocation]);

  // 计算各维度标准化分数
  const calculateDimensions = (results: AssessmentResults): CognitiveDimension[] => {
    const dims: CognitiveDimension[] = [];

    // 1. 持续注意力 (CPT)
    if (results.cpt) {
      const { dPrime, hitRate, falseAlarmRate } = results.cpt;
      // d' 范围通常 0-4，优秀 >2.5，良好 1.5-2.5，一般 0.5-1.5
      // 命中率和虚报率也纳入考虑
      const dPrimeScore = Math.min(100, (dPrime / 4) * 100);
      const hitScore = hitRate * 100;
      const faScore = (1 - falseAlarmRate) * 100;
      const score = Math.round((dPrimeScore * 0.5 + hitScore * 0.3 + faScore * 0.2));
      
      dims.push({
        id: "sustained-attention",
        name: "持续注意力",
        shortName: "持续注意",
        icon: Target,
        score,
        level: getLevel(score),
        description: "维持长时间专注和警觉的能力",
      });
    }

    // 2. 工作记忆 (N-back)
    if (results.nback) {
      const { accuracy, workingMemoryCapacity } = results.nback;
      // 准确率和工作记忆容量K值
      const accScore = accuracy * 100;
      const kScore = Math.min(100, (workingMemoryCapacity / 4) * 100); // K值通常0-4
      const score = Math.round((accScore * 0.6 + kScore * 0.4));
      
      dims.push({
        id: "working-memory",
        name: "工作记忆",
        shortName: "工作记忆",
        icon: Brain,
        score,
        level: getLevel(score),
        description: "短时间内保持和操作信息的能力",
      });
    }

    // 3. 抑制控制 (Go/No-Go)
    if (results.gonogo) {
      const { nogoAccuracy, inhibitionIndex, overallAccuracy } = results.gonogo;
      // No-Go准确率最重要，抑制控制指数和总准确率辅助
      const nogoScore = nogoAccuracy * 100;
      const inhibitionScore = Math.min(100, Math.max(0, (inhibitionIndex + 0.5) * 100)); // 归一化到0-100
      const overallScore = overallAccuracy * 100;
      const score = Math.round((nogoScore * 0.5 + inhibitionScore * 0.3 + overallScore * 0.2));
      
      dims.push({
        id: "inhibitory-control",
        name: "抑制控制",
        shortName: "抑制控制",
        icon: Zap,
        score,
        level: getLevel(score),
        description: "抑制冲动反应和干扰信息的能力",
      });
    }

    // 4. 认知灵活性 (Stroop)
    if (results.stroop) {
      const { incongruentAccuracy, stroopEffect, cognitiveFlexibilityIndex } = results.stroop;
      // 不一致条件准确率，Stroop效应越小越好，认知灵活性指数
      const accScore = incongruentAccuracy * 100;
      const effectScore = Math.max(0, 100 - (stroopEffect / 10)); // 效应越小分数越高
      const flexScore = Math.min(100, Math.max(0, (cognitiveFlexibilityIndex + 0.5) * 100));
      const score = Math.round((accScore * 0.4 + effectScore * 0.3 + flexScore * 0.3));
      
      dims.push({
        id: "cognitive-flexibility",
        name: "认知灵活性",
        shortName: "认知灵活",
        icon: Palette,
        score,
        level: getLevel(score),
        description: "在不同任务间切换和适应的能力",
      });
    }

    // 5. 注意广度 (Attention Span)
    if (results["attention-span"]) {
      const { attentionSpanScore, consistency, avgErrorCount } = results["attention-span"];
      // 注意广度分数越低越好，一致性越高越好，错误越少越好
      const spanScore = Math.max(0, 100 - (attentionSpanScore * 3)); // 归一化
      const consistScore = consistency * 100;
      const errorScore = Math.max(0, 100 - (avgErrorCount * 10));
      const score = Math.round((spanScore * 0.4 + consistScore * 0.3 + errorScore * 0.3));
      
      dims.push({
        id: "attention-span",
        name: "注意广度",
        shortName: "注意广度",
        icon: Grid3x3,
        score,
        level: getLevel(score),
        description: "同时处理多个信息源的能力",
      });
    }

    // 6. 视觉记忆 (Visual Memory)
    if (results["visual-memory"]) {
      const { visualMemoryScore, memoryEfficiency, errorRate } = results["visual-memory"];
      // 视觉记忆分数，记忆效率，错误率
      const memScore = visualMemoryScore;
      const effScore = memoryEfficiency * 100;
      const errScore = (1 - errorRate) * 100;
      const score = Math.round((memScore * 0.5 + effScore * 0.3 + errScore * 0.2));
      
      dims.push({
        id: "visual-memory",
        name: "视觉空间记忆",
        shortName: "视觉记忆",
        icon: ImageIcon,
        score,
        level: getLevel(score),
        description: "记忆和识别视觉信息的能力",
      });
    }

    return dims;
  };

  // 根据分数获取等级
  const getLevel = (score: number): "excellent" | "good" | "fair" | "needs_improvement" => {
    if (score >= 80) return "excellent";
    if (score >= 65) return "good";
    if (score >= 50) return "fair";
    return "needs_improvement";
  };

  // 获取等级文本和颜色
  const getLevelInfo = (level: string) => {
    switch (level) {
      case "excellent":
        return { text: "优秀", color: "bg-green-100 text-green-800 border-green-200" };
      case "good":
        return { text: "良好", color: "bg-blue-100 text-blue-800 border-blue-200" };
      case "fair":
        return { text: "一般", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
      case "needs_improvement":
        return { text: "需改进", color: "bg-red-100 text-red-800 border-red-200" };
      default:
        return { text: "未知", color: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  // 生成训练建议
  const getTrainingRecommendations = () => {
    const weakDimensions = dimensions.filter(d => d.score < 65).sort((a, b) => a.score - b.score);
    
    if (weakDimensions.length === 0) {
      return [
        {
          title: "保持优秀表现",
          description: "您的各项认知能力都表现优秀！继续保持规律训练，巩固现有水平。",
          games: ["所有训练游戏"],
        },
      ];
    }

    const recommendations = weakDimensions.slice(0, 3).map(dim => {
      const gameMap: Record<string, { games: string[], tips: string }> = {
        "sustained-attention": {
          games: ["CPT持续注意力训练", "Go/No-Go游戏"],
          tips: "建议每天训练15-20分钟，保持专注，避免分心。",
        },
        "working-memory": {
          games: ["N-back工作记忆训练", "记忆翻牌游戏"],
          tips: "从简单难度开始，逐步提升N值，每天训练10-15分钟。",
        },
        "inhibitory-control": {
          games: ["Go/No-Go游戏", "Stroop游戏"],
          tips: "重点练习抑制冲动反应，提高反应控制能力。",
        },
        "cognitive-flexibility": {
          games: ["Stroop游戏", "任务切换训练"],
          tips: "练习在不同规则间快速切换，提高认知灵活性。",
        },
        "attention-span": {
          games: ["舒尔特方格", "视觉搜索游戏"],
          tips: "每天练习3-5轮，提高视觉搜索速度和准确性。",
        },
        "visual-memory": {
          games: ["记忆翻牌游戏", "图案记忆训练"],
          tips: "使用记忆策略（如分组、联想），提高记忆效率。",
        },
      };

      const info = gameMap[dim.id] || { games: ["综合训练"], tips: "建议每天坚持训练。" };
      
      return {
        title: `提升${dim.name}`,
        description: `当前得分：${dim.score}/100。${info.tips}`,
        games: info.games,
      };
    });

    return recommendations;
  };

  const recommendations = getTrainingRecommendations();

  // 获取总体评价
  const getOverallEvaluation = () => {
    if (overallScore >= 80) {
      return {
        title: "认知能力优秀",
        description: "您的整体认知表现非常出色，各项能力均衡发展。继续保持规律训练，巩固优势。",
        icon: Award,
        color: "text-green-600",
      };
    } else if (overallScore >= 65) {
      return {
        title: "认知能力良好",
        description: "您的整体认知表现良好，部分维度有提升空间。建议针对弱项进行专项训练。",
        icon: TrendingUp,
        color: "text-blue-600",
      };
    } else {
      return {
        title: "认知能力有待提升",
        description: "您的部分认知能力需要加强训练。请按照下方建议进行针对性练习，坚持训练会看到明显进步。",
        icon: AlertCircle,
        color: "text-amber-600",
      };
    }
  };

  const evaluation = getOverallEvaluation();

  if (dimensions.length === 0) {
    return null; // 加载中或重定向
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="container max-w-6xl mx-auto">
        {/* 标题区域 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">认知能力评估报告</h1>
          <p className="text-muted-foreground">
            基于6项标准化测试的综合分析
          </p>
        </div>

        {/* 总体评价卡片 */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center`}>
                <evaluation.icon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">{evaluation.title}</CardTitle>
                <CardDescription className="text-base mt-1">
                  综合得分：<span className="text-2xl font-bold text-primary">{overallScore}</span>/100
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{evaluation.description}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 雷达图 */}
          <Card>
            <CardHeader>
              <CardTitle>认知能力雷达图</CardTitle>
              <CardDescription>六维能力可视化对比</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis 
                    dataKey="dimension" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                  />
                  <Radar 
                    name="得分" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 各维度得分列表 */}
          <Card>
            <CardHeader>
              <CardTitle>各维度详细得分</CardTitle>
              <CardDescription>点击查看详细指标</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dimensions.map((dim) => {
                const Icon = dim.icon;
                const levelInfo = getLevelInfo(dim.level);
                return (
                  <div key={dim.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{dim.name}</span>
                        <Badge variant="outline" className={`text-xs ${levelInfo.color}`}>
                          {levelInfo.text}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{dim.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-primary">{dim.score}</div>
                      <div className="text-xs text-muted-foreground">/ 100</div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* 训练建议 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>个性化训练建议</CardTitle>
            <CardDescription>根据您的评估结果，我们为您推荐以下训练方案</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
                  <h3 className="font-semibold mb-2 text-primary">{rec.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-700">推荐训练：</p>
                    {rec.games.map((game, idx) => (
                      <div key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-primary rounded-full"></span>
                        {game}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => setLocation("/app/dashboard")}>
            返回首页
          </Button>
          <Button onClick={() => setLocation("/app/games")}>
            开始训练
          </Button>
          <Button variant="outline" onClick={() => {
            localStorage.removeItem("assessment_progress");
            setLocation("/app/assessment");
          }}>
            重新评估
          </Button>
        </div>

        {/* 说明文字 */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>建议每7-14天进行一次评估，追踪训练效果</p>
          <p className="mt-1">评估结果会与您的账号绑定保存；未登录或同步失败时会保留本机草稿</p>
        </div>
      </div>
    </div>
  );
}

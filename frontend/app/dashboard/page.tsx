'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleHeader } from '@/components/ui/collapsible';
import { FileText, MessageSquare, Code, TrendingUp, CheckCircle2, XCircle, Loader2, AlertCircle, BarChart3, Target, Clock, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { resumesApi } from '@/lib/api/resumes';
import { interviewsApi, Interview } from '@/lib/api/interviews';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { SkillAveragesCard } from '@/components/analytics/skill-averages-card';
import { SkillProgressionChart } from '@/components/analytics/skill-progression-chart';
import { InterviewSkillCard } from '@/components/analytics/interview-skill-card';
import { SkillComparison } from '@/components/analytics/skill-comparison';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Resume {
  id: number;
  file_name: string;
  file_size: number;
  file_type: string;
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  extracted_data?: any;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [isStatsOpen, setIsStatsOpen] = useState(false); // Collapsed by default
  const [selectedInterviewIds, setSelectedInterviewIds] = useState<number[]>([]);
  const queryClient = useQueryClient();

  // Fetch data
  const { data: resumes, isLoading: resumesLoading } = useQuery<Resume[]>({
    queryKey: ['resumes'],
    queryFn: () => resumesApi.list(),
  });

  const { data: interviews, isLoading: interviewsLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => interviewsApi.list(),
  });

  // Fetch skill analytics
  const { data: skillProgression, isLoading: progressionLoading } = useQuery({
    queryKey: ['skill-progression'],
    queryFn: () => interviewsApi.getSkillProgression(),
    enabled: !!interviews,
  });

  const { data: skillAverages, isLoading: averagesLoading } = useQuery({
    queryKey: ['skill-averages'],
    queryFn: () => interviewsApi.getSkillAverages(),
    enabled: !!interviews,
  });

  const { data: skillComparison, isLoading: comparisonLoading } = useQuery({
    queryKey: ['skill-comparison', selectedInterviewIds],
    queryFn: () => interviewsApi.compareSkillInterviews(selectedInterviewIds),
    enabled: selectedInterviewIds.length >= 2,
  });


  const completedInterviews = interviews?.filter((i) => i.status === 'completed') || [];
  const inProgressInterviews = interviews?.filter((i) => i.status === 'in_progress') || [];
  const totalTurns = interviews?.reduce((sum, i) => sum + i.turn_count, 0) || 0;
  const avgTurns = interviews && interviews.length > 0 
    ? Math.round(totalTurns / interviews.length) 
    : 0;

  const avgScore = completedInterviews.length > 0
    ? completedInterviews.reduce((sum, i) => {
        const score = i.feedback?.overall_score || 0;
        return sum + score;
      }, 0) / completedInterviews.length
    : 0;

  // Stats for collapsible section
  const stats = [
    {
      title: '面试总数',
      value: interviews?.length || 0,
      icon: MessageSquare,
      description: '累计记录',
    },
    {
      title: '已完成',
      value: completedInterviews.length,
      icon: CheckCircle2,
      description: '完成的面试',
    },
    {
      title: '进行中',
      value: inProgressInterviews.length,
      icon: Clock,
      description: '当前会话',
    },
    {
      title: '平均分',
      value: `${Math.round(avgScore * 100)}%`,
      icon: Target,
      description: '基于已完成面试',
    },
    {
      title: '总轮次',
      value: totalTurns,
      icon: TrendingUp,
      description: '对话轮数',
    },
    {
      title: '平均轮次',
      value: avgTurns,
      icon: BarChart3,
      description: '每场面试',
    },
  ];

  const recentInterviews = interviews
    ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3) || [];

  const toggleInterviewSelection = (interviewId: number) => {
    setSelectedInterviewIds(prev => {
      if (prev.includes(interviewId)) {
        return prev.filter(id => id !== interviewId);
      } else {
        if (prev.length >= 3) {
          return prev.slice(1).concat(interviewId);
        }
        return [...prev, interviewId];
      }
    });
  };

  const clearSelection = () => {
    setSelectedInterviewIds([]);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          欢迎回来，{user?.full_name?.split(' ')[0] || '用户'}！
        </h1>
        <p className="text-muted-foreground mt-2">
          通过人工智能练习，提前为下一场面试做好准备。
        </p>
      </div>

      {/* Basic Stats Grid - Always Visible */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          {
            title: '简历',
            value: resumesLoading ? '...' : (resumes?.length || 0).toString(),
            description: '已上传简历',
            icon: FileText,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950',
          },
          {
            title: '面试',
            value: interviewsLoading ? '...' : (interviews?.length || 0).toString(),
            description: '练习场次',
            icon: MessageSquare,
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-950',
          },
          {
            title: '已完成',
            value: interviewsLoading ? '...' : completedInterviews.length.toString(),
            description: '完成的面试',
            icon: Code,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-950',
          },
          {
            title: '平均分',
            value: avgScore === 0 ? '--' : `${Math.round(avgScore * 100)}%`,
            description: '整体表现',
            icon: TrendingUp,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-950',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Collapsible Detailed Stats Section */}
      <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen}>
        <CollapsibleHeader className="group cursor-pointer flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
          <span className="text-lg font-semibold">详细统计</span>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isStatsOpen ? 'rotate-180' : ''}`} />
        </CollapsibleHeader>
        <CollapsibleContent className="pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {interviewsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stat.description}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-1">
        {/* Recent Interviews */}
        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <CardDescription>你最近的面试练习记录</CardDescription>
          </CardHeader>
          <CardContent>
            {interviewsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentInterviews.length > 0 ? (
              <div className="space-y-3">
                {recentInterviews.map((interview) => (
                  <Link
                    key={interview.id}
                    href={`/dashboard/interviews/${interview.id}`}
                    className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{interview.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(interview.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium">
                          {interview.status === 'completed' ? '✓' : interview.status === 'in_progress' ? '→' : '○'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {interview.turn_count} 轮
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                <Button asChild variant="outline" className="w-full mt-2">
                  <Link href="/dashboard/interviews">查看全部面试</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>暂时还没有最近活动</p>
                <p className="text-sm mt-2">开始第一场面试后，这里会显示记录</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Skill Analytics Section - Charts */}
      <div className="space-y-6 mt-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">能力分析</h2>
          <p className="text-muted-foreground mt-1">
            跟踪你的表现和能力成长趋势
          </p>
        </div>
        
        {completedInterviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">还没有已完成的面试</h3>
              <p className="text-muted-foreground mb-4">
                完成一场面试后，这里会显示能力分析和成长图表。
              </p>
              <Button asChild>
                <Link href="/dashboard/interviews">
                  开始面试
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
        <div className="space-y-6">

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">总览</TabsTrigger>
              <TabsTrigger value="progression">成长趋势</TabsTrigger>
              <TabsTrigger value="comparison">对比分析</TabsTrigger>
              <TabsTrigger value="interviews">面试详情</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Skill Averages */}
              {averagesLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              ) : skillAverages ? (
                <SkillAveragesCard
                  averages={skillAverages}
                  title="平均能力得分"
                  description="你在所有已完成面试中的平均表现"
                />
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂时还没有能力数据，完成一场面试后即可看到评分。</p>
                  </CardContent>
                </Card>
              )}

              {/* Skill Progression Chart */}
              {progressionLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-96 w-full" />
                  </CardContent>
                </Card>
              ) : skillProgression && (
                Object.values(skillProgression).some(skill => skill.length > 0) ? (
                  <SkillProgressionChart
                    data={skillProgression}
                    title="能力成长趋势"
                    description="查看你在不同面试中的能力提升情况"
                  />
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>完成更多面试后，这里会显示更完整的成长趋势。</p>
                    </CardContent>
                  </Card>
                )
              )}
            </TabsContent>

            {/* Progression Tab */}
            <TabsContent value="progression" className="space-y-6">
              {progressionLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-96 w-full" />
                  </CardContent>
                </Card>
              ) : skillProgression && (
                Object.values(skillProgression).some(skill => skill.length > 0) ? (
                  <SkillProgressionChart
                    data={skillProgression}
                    title="能力成长趋势"
                    description="查看你在不同面试中的能力提升情况"
                  />
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>完成更多面试后，这里会显示更完整的成长趋势。</p>
                    </CardContent>
                  </Card>
                )
              )}
            </TabsContent>

            {/* Comparison Tab */}
            <TabsContent value="comparison" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>面试对比</CardTitle>
                  <CardDescription>
                    选择 2 到 3 场已完成面试，对比能力得分
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {completedInterviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      暂时没有可用于对比的已完成面试。
                    </p>
                  ) : (
                    <>
                      <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-4">
                        {completedInterviews.map((interview) => (
                          <div key={interview.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`interview-${interview.id}`}
                              checked={selectedInterviewIds.includes(interview.id)}
                              onCheckedChange={() => toggleInterviewSelection(interview.id)}
                              disabled={!selectedInterviewIds.includes(interview.id) && selectedInterviewIds.length >= 3}
                            />
                            <Label
                              htmlFor={`interview-${interview.id}`}
                              className="flex-1 cursor-pointer flex items-center justify-between"
                            >
                              <span className="font-medium">{interview.title}</span>
                              <span className="text-sm text-muted-foreground">
                                {interview.completed_at 
                                  ? format(new Date(interview.completed_at), 'MMM d, yyyy')
                                  : format(new Date(interview.created_at), 'MMM d, yyyy')}
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
                      
                      {selectedInterviewIds.length > 0 && (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            已选择 {selectedInterviewIds.length} 场面试
                          </p>
                          <Button variant="outline" size="sm" onClick={clearSelection}>
                            清空选择
                          </Button>
                        </div>
                      )}

                      {selectedInterviewIds.length < 2 && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950 dark:border-yellow-900">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            至少选择 2 场面试后才能开始对比。
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {comparisonLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-96 w-full" />
                  </CardContent>
                </Card>
              ) : skillComparison && selectedInterviewIds.length >= 2 ? (
                <SkillComparison
                  comparison={skillComparison}
                  title="面试能力对比"
                  description="对比你在不同面试中的表现"
                />
              ) : selectedInterviewIds.length >= 2 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>正在加载对比数据...</p>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            {/* Individual Interviews Tab */}
            <TabsContent value="interviews" className="space-y-6">
              {completedInterviews.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">没有已完成的面试</h3>
                    <p className="text-muted-foreground">
                      完成面试后，这里会显示详细的能力拆解
                    </p>
                  </CardContent>
                </Card>
              ) : (
                completedInterviews.map((interview) => (
                  <InterviewSkillBreakdown key={interview.id} interviewId={interview.id} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
        )}
      </div>
    </div>
  );
}

// Component to fetch and display individual interview skill breakdown
function InterviewSkillBreakdown({ interviewId }: { interviewId: number }) {
  const { data: skillBreakdown, isLoading } = useQuery({
    queryKey: ['interview-skills', interviewId],
    queryFn: () => interviewsApi.getInterviewSkills(interviewId),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!skillBreakdown) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>这场面试暂时还没有能力拆解数据。</p>
        </CardContent>
      </Card>
    );
  }

  return <InterviewSkillCard breakdown={skillBreakdown} />;
}

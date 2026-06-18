'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { SkillRadarChart } from './skill-radar-chart';
import { InterviewSkillBreakdown } from '@/lib/api/interviews';

interface InterviewSkillCardProps {
  breakdown: InterviewSkillBreakdown;
  showRadar?: boolean;
}

export function InterviewSkillCard({ breakdown, showRadar = true }: InterviewSkillCardProps) {
  const { skill_breakdown, interview_title, completed_at } = breakdown;

  const radarData = [
    { skill: '沟通表达', score: Math.round(skill_breakdown.communication.score * 100) },
    { skill: '技术能力', score: Math.round(skill_breakdown.technical.score * 100) },
    { skill: '问题解决', score: Math.round(skill_breakdown.problem_solving.score * 100) },
    { skill: '代码质量', score: Math.round(skill_breakdown.code_quality.score * 100) },
  ];

  const skills = [
    { key: 'communication' as const, label: '沟通表达', icon: '💬' },
    { key: 'technical' as const, label: '技术能力', icon: '🧠' },
    { key: 'problem_solving' as const, label: '问题解决', icon: '🧩' },
    { key: 'code_quality' as const, label: '代码质量', icon: '📝' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return '优秀';
    if (score >= 0.6) return '良好';
    return '待提升';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{interview_title}</CardTitle>
          {completed_at && (
            <CardDescription>
              完成时间：{new Date(completed_at).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {showRadar && (
        <SkillRadarChart
          data={radarData}
          title="能力拆解"
          description="查看你在不同能力维度上的表现"
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {skills.map((skill) => {
          const skillData = skill_breakdown[skill.key];
          const score = skillData.score;
          const percentage = Math.round(score * 100);

          return (
            <Card key={skill.key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <span>{skill.icon}</span>
                    <span>{skill.label}</span>
                  </CardTitle>
                  <Badge className={getScoreColor(score)}>
                    {percentage}% - {getScoreLabel(score)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>得分</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${getScoreColor(score)} h-2 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {skillData.strengths && skillData.strengths.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="font-semibold text-sm">做得好的地方</span>
                    </div>
                    <ul className="space-y-1 ml-6">
                      {skillData.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground list-disc">
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {skillData.weaknesses && skillData.weaknesses.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="font-semibold text-sm">需要改进的地方</span>
                    </div>
                    <ul className="space-y-1 ml-6">
                      {skillData.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground list-disc">
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {skillData.recommendations && skillData.recommendations.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold text-sm">改进建议</span>
                    </div>
                    <ul className="space-y-1 ml-6">
                      {skillData.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground list-disc">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

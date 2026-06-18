'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Plus, Play, CheckCircle2, Clock, XCircle, Loader2, Trash2 } from 'lucide-react';
import { interviewsApi, Interview } from '@/lib/api/interviews';
import { resumesApi } from '@/lib/api/resumes';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function InterviewsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newInterview, setNewInterview] = useState({ title: '', resume_id: 'none', job_description: '' });
  const queryClient = useQueryClient();

  // Fetch interviews
  const { data: interviews, isLoading } = useQuery<Interview[]>({
    queryKey: ['interviews'],
    queryFn: () => interviewsApi.list(),
  });

  // Fetch resumes for dropdown
  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumesApi.list(),
  });

  // Create interview mutation
  const createMutation = useMutation({
    mutationFn: (data: { title: string; resume_id?: number; job_description?: string }) =>
      interviewsApi.create(data),
    onSuccess: () => {
      toast.success('面试创建成功');
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      setIsCreateOpen(false);
      setNewInterview({ title: '', resume_id: 'none', job_description: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || '创建面试失败');
    },
  });

  // Delete interview mutation
  const deleteMutation = useMutation({
    mutationFn: (interviewId: number) => interviewsApi.delete(interviewId),
    onSuccess: () => {
      toast.success('面试删除成功');
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
    onError: (error: any) => {
      toast.error(error.message || '删除面试失败');
    },
  });

  const handleDelete = (interviewId: number, interviewTitle: string) => {
    if (confirm(`确认删除“${interviewTitle}”吗？此操作无法撤销。`)) {
      deleteMutation.mutate(interviewId);
    }
  };

  const handleCreate = () => {
    if (!newInterview.title.trim()) {
      toast.error('请输入面试标题');
      return;
    }
    createMutation.mutate({
      title: newInterview.title,
      resume_id: newInterview.resume_id && newInterview.resume_id !== 'none' 
        ? parseInt(newInterview.resume_id) 
        : undefined,
      job_description: newInterview.job_description.trim() || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            已完成
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary">
            <Play className="mr-1 h-3 w-3" />
            进行中
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            待开始
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            已取消
          </Badge>
        );
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">面试记录</h1>
          <p className="text-muted-foreground mt-2">
            通过人工智能问题进行面试练习
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建面试
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新面试</DialogTitle>
              <DialogDescription>
                开始一场新的面试练习
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">面试标题</Label>
                <Input
                  id="title"
                  placeholder="例如：前端工程师模拟面试"
                  value={newInterview.title}
                  onChange={(e) =>
                    setNewInterview({ ...newInterview, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resume">关联简历（可选）</Label>
                <Select
                  value={newInterview.resume_id}
                  onValueChange={(value) =>
                    setNewInterview({ ...newInterview, resume_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择一份简历" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不关联简历</SelectItem>
                    {resumes?.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id.toString()}>
                        {resume.file_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_description">岗位描述（可选）</Label>
                <textarea
                  id="job_description"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="把岗位描述粘贴到这里，系统会据此生成更相关的问题和编程练习。"
                  value={newInterview.job_description}
                  onChange={(e) =>
                    setNewInterview({ ...newInterview, job_description: e.target.value })
                  }
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建中...
                  </>
                ) : (
                  '创建面试'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : interviews && interviews.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {interviews.map((interview) => (
            <Card
              key={interview.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <CardTitle className="text-lg truncate">{interview.title}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                    onClick={() => handleDelete(interview.id, interview.title)}
                    disabled={deleteMutation.isPending}
                      title="删除面试"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <CardDescription>
                  {format(new Date(interview.created_at), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  {getStatusBadge(interview.status)}
                  <span className="text-sm text-muted-foreground">
                    {interview.turn_count} 轮
                  </span>
                </div>
                {interview.status === 'pending' && (
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/dashboard/interviews/${interview.id}`}>
                      <Play className="mr-2 h-4 w-4" />
                      开始面试
                    </Link>
                  </Button>
                )}
                {interview.status === 'in_progress' && (
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/dashboard/interviews/${interview.id}`}>
                      继续面试
                    </Link>
                  </Button>
                )}
                {interview.status === 'completed' && (
                  <div className="space-y-2">
                    <Button asChild variant="outline" className="w-full" size="sm">
                      <Link href={`/dashboard/interviews/${interview.id}`}>
                        查看详情
                      </Link>
                    </Button>
                    {interview.feedback && (
                      <div className="text-xs text-muted-foreground">
                        得分：{interview.feedback.overall_score
                          ? `${Math.round(interview.feedback.overall_score * 100)}%`
                          : '暂无'}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">还没有面试记录</h3>
            <p className="text-muted-foreground text-center mb-4">
              创建第一场面试，开始你的练习
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              创建面试
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


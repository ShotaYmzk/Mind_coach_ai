import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { format, isToday, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, CheckCircle, ClipboardList, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// 型定義
interface Reservation {
  id: number;
  date: string; // ISO
  coachName: string;
}
interface Task {
  id: number;
  title: string;
  dueDate: string; // ISO
  completed: boolean;
}

export default function Status() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = new QueryClient();
  const [newTask, setNewTask] = useState("");

  // ログインチェック
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  // 予約取得 (ユーザー向け)
  const { data: reservations = [], isLoading: resLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations"],
    queryFn: () => fetch("/api/reservations").then(res => res.json()),
    enabled: !!user,
  });

  // タスク取得
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    queryFn: () => fetch("/api/tasks").then(res => res.json()),
    enabled: !!user,
  });

  // タスク追加
  const addTaskMutation = useMutation(
    (title: string) => fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dueDate: new Date().toISOString(), completed: false }),
    }),
    {
      onSuccess: () => {
        toast({ title: "タスクを追加しました" });
        queryClient.invalidateQueries(["/api/tasks"]);
        setNewTask("");
      },
      onError: () => {
        toast({ title: "タスクの追加に失敗しました", variant: "destructive" });
      },
    }
  );

  // タスクステータス更新
  const updateTaskMutation = useMutation(
    ({ id, completed }: { id: number; completed: boolean }) =>
      fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      }),
    {
      onSuccess: () => {
        toast({ title: "タスクを更新しました" });
        queryClient.invalidateQueries(["/api/tasks"]);
      },
      onError: () => {
        toast({ title: "タスクの更新に失敗しました", variant: "destructive" });
      },
    }
  );

  // フォーム送信
  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTaskMutation.mutate(newTask.trim());
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  // 今日のタスク
  const todayTasks = tasks.filter(t => isToday(parseISO(t.dueDate)));
  const upcomingMeetings = reservations.filter(r => !isToday(parseISO(r.date)));

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* 概要カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-neutral-600">今後の面談予定</p>
            <p className="text-2xl font-bold">{resLoading ? <Skeleton className="h-8 w-16" /> : upcomingMeetings.length}</p>
          </div>
          <CalendarClock className="h-10 w-10 text-primary-400" />
        </Card>
        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-neutral-600">今日のタスク</p>
            <p className="text-2xl font-bold">{tasksLoading ? <Skeleton className="h-8 w-16" /> : todayTasks.length}</p>
          </div>
          <ClipboardList className="h-10 w-10 text-secondary-400" />
        </Card>
      </div>

      {/* 面談予定一覧 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>面談予定一覧</CardTitle>
          <CardDescription>今後の面談予定を確認できます</CardDescription>
        </CardHeader>
        <CardContent>
          {resLoading ? (
            <Skeleton className="h-20 w-full" count={3} />
          ) : upcomingMeetings.length > 0 ? (
            upcomingMeetings.map(r => (
              <div key={r.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <span>{format(parseISO(r.date), "yyyy年MM月dd日(E) HH:mm", { locale: ja })}</span>
                <span>{r.coachName} コーチ</span>
              </div>
            ))
          ) : (
            <p className="text-center text-neutral-500 py-4">面談予定はありません</p>
          )}
        </CardContent>
      </Card>

      {/* 今日のタスク一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>今日のタスク</CardTitle>
          <CardDescription>今日やるべきことを管理しましょう</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 新規タスク追加 */}
          <form onSubmit={handleAddTask} className="flex gap-2">
            <Input
              placeholder="新しいタスクを追加"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              disabled={addTaskMutation.isLoading}
            />
            <Button type="submit" size="sm" disabled={addTaskMutation.isLoading || !newTask.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          {tasksLoading ? (
            <Skeleton className="h-16 w-full" count={2} />
          ) : todayTasks.length > 0 ? (
            todayTasks.map(task => (
              <div key={task.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant={task.completed ? "ghost" : "outline"}
                    size="icon"
                    onClick={() => updateTaskMutation.mutate({ id: task.id, completed: !task.completed })}
                  >
                    <CheckCircle className={`h-5 w-5 ${task.completed ? 'text-green-600' : 'text-neutral-400'}`} />
                  </Button>
                  <span className={task.completed ? 'line-through text-neutral-500' : ''}>{task.title}</span>
                </div>
                <span className="text-xs text-neutral-400">
                  {format(parseISO(task.dueDate), "HH:mm", { locale: ja })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-neutral-500 py-4">今日のタスクはありません</p>
          )}
        </CardContent>
      </Card>

      {/* オススメ機能 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>次のステップ</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button variant="outline" asChild>
            <a href="/assessment">
              <CheckCircle className="mr-2 h-4 w-4" />
              週間ストレスチェックを受ける
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/coaching">
              <CalendarClock className="mr-2 h-4 w-4" />
              AIコーチングを始める
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

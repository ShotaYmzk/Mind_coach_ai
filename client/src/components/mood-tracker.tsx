import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { createBarChart, type MoodData } from "@/lib/charts";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function MoodTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMood, setCurrentMood] = useState<number>(3);
  const [note, setNote] = useState<string>("");
  const [triggers, setTriggers] = useState<string>("");
  const [selectedMood, setSelectedMood] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);

  // Fetch mood entries
  const { data: moodEntries, isLoading } = useQuery({
    queryKey: ["/api/mood"],
    enabled: !!user,
  });

  // Submit mood mutation
  const { mutate: submitMood, isPending } = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/mood", {
        rating: currentMood,
        note: note,
        triggers: triggers
      });
    },
    onSuccess: () => {
      toast({
        title: "気分を記録しました",
        description: "今日の気分が記録されました。",
      });
      // リセット
      setNote("");
      setTriggers("");
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "気分の記録中にエラーが発生しました。",
        variant: "destructive",
      });
    },
  });

  // Initialize chart when data is loaded
  useEffect(() => {
    if (chartRef.current && moodEntries?.length > 0) {
      // Clear previous chart if it exists
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      // Format data for chart
      const chartData: MoodData[] = moodEntries.map((entry: any) => ({
        date: new Date(entry.createdAt),
        rating: entry.rating,
      }));

      // Create new chart
      chartInstanceRef.current = createBarChart(chartRef.current, chartData);
    }
  }, [moodEntries]);

  // Emoji based on mood value (1-10 scale)
  function getMoodEmoji(value: number) {
    if (value <= 3) return "😔"; // 悪い気分
    if (value <= 5) return "😐"; // やや悪い気分
    if (value <= 8) return "🙂"; // やや良い気分
    return "😄";                 // 良い気分
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="px-6 py-5 border-b border-neutral-200">
        <CardTitle className="text-lg font-heading font-medium text-neutral-900">気分トラッカー</CardTitle>
        <CardDescription className="mt-1 text-sm text-neutral-500">
          過去30日間の気分の変化
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="h-64 space-y-4">
            <Skeleton className="w-full h-40" />
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-full h-8" />
          </div>
        ) : (
          <>
            <div className="h-64 relative">
              <canvas ref={chartRef} />
            </div>
            <div className="mt-4">
              <p className="text-sm text-neutral-600 mb-2 text-center">今日の気分はいかがですか？</p>
              <div className="flex items-center justify-between mx-auto max-w-md mb-2">
                <span className="text-xl flex flex-col items-center gap-1">
                  {getMoodEmoji(1)}
                  <span className="text-xs text-neutral-500">1</span>
                </span>
                <span className="text-xl flex flex-col items-center gap-1">
                  {getMoodEmoji(4)}
                  <span className="text-xs text-neutral-500">4</span>
                </span>
                <span className="text-xl flex flex-col items-center gap-1">
                  {getMoodEmoji(7)}
                  <span className="text-xs text-neutral-500">7</span>
                </span>
                <span className="text-xl flex flex-col items-center gap-1">
                  {getMoodEmoji(10)}
                  <span className="text-xs text-neutral-500">10</span>
                </span>
              </div>
              <div className="mb-4">
                <Slider
                  className="max-w-md mx-auto"
                  defaultValue={[currentMood]}
                  max={10}
                  min={1}
                  step={1}
                  onValueChange={(value) => setCurrentMood(value[0])}
                />
              </div>
              
              {/* メモと引き金 */}
              <div className="mt-6 mb-4 space-y-4">
                <div>
                  <Label htmlFor="note" className="text-sm">メモ (任意)</Label>
                  <Textarea
                    id="note"
                    placeholder="今日の気分について、何か書き留めておきたいことはありますか？"
                    className="mt-1"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="triggers" className="text-sm">気分の引き金 (任意)</Label>
                  <Textarea
                    id="triggers"
                    placeholder="今日の気分に影響を与えた出来事や状況があれば記入してください"
                    className="mt-1"
                    value={triggers}
                    onChange={(e) => setTriggers(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="text-center mt-4">
                <Button
                  onClick={() => submitMood()}
                  disabled={isPending}
                  className="mt-2"
                >
                  {isPending ? "送信中..." : "今日の気分を記録"}
                </Button>
              </div>
            </div>
            
            {/* 過去の記録を見るダイアログ */}
            {moodEntries && Array.isArray(moodEntries) && moodEntries.length > 0 && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full mt-4">過去の記録を見る</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>気分の記録履歴</DialogTitle>
                    <DialogDescription>
                      過去の気分とメモの記録を確認できます
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="max-h-[60vh] overflow-y-auto space-y-4 py-4">
                    {moodEntries.map((entry: any) => (
                      <Card key={entry.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getMoodEmoji(entry.rating)}</span>
                            <span className="font-medium">{entry.rating}/10</span>
                          </div>
                          <span className="text-sm text-neutral-500">
                            {format(new Date(entry.createdAt), 'yyyy年MM月dd日 HH:mm')}
                          </span>
                        </div>
                        
                        {entry.note && (
                          <div className="mt-2">
                            <Label className="text-xs">メモ</Label>
                            <p className="text-sm mt-1">{entry.note}</p>
                          </div>
                        )}
                        
                        {entry.triggers && (
                          <div className="mt-2">
                            <Label className="text-xs">気分の引き金</Label>
                            <p className="text-sm mt-1">{entry.triggers}</p>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      閉じる
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

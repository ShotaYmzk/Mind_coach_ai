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

export default function MoodTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMood, setCurrentMood] = useState<number>(7);
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
      });
    },
    onSuccess: () => {
      toast({
        title: "気分を記録しました",
        description: "今日の気分が記録されました。",
      });
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

  // Emoji based on mood value
  function getMoodEmoji(value: number) {
    if (value <= 2) return "😔";
    if (value <= 4) return "😐";
    if (value <= 7) return "🙂";
    return "😄";
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
            <div className="mt-4 text-center">
              <p className="text-sm text-neutral-600 mb-2">今日の気分はいかがですか？</p>
              <div className="flex items-center justify-between mx-auto max-w-md mb-2">
                <span className="text-xl">{getMoodEmoji(1)}</span>
                <span className="text-xl">{getMoodEmoji(4)}</span>
                <span className="text-xl">{getMoodEmoji(7)}</span>
                <span className="text-xl">{getMoodEmoji(10)}</span>
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
              <Button
                onClick={() => submitMood()}
                disabled={isPending}
                className="mt-2"
              >
                {isPending ? "送信中..." : "今日の気分を記録"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

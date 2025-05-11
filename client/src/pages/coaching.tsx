import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import AIChat from "@/components/ai-chat";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function CoachingPage() {
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const { toast } = useToast();

  // チャットセッション一覧を取得
  const { 
    data: sessions, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["/api/chat/sessions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/chat/sessions");
      return res.json();
    }
  });

  // 初期セッションが存在しない場合は新規作成
  useEffect(() => {
    if (!isLoading && !error && Array.isArray(sessions) && sessions.length === 0) {
      createNewSession();
    } else if (Array.isArray(sessions) && sessions.length > 0 && !activeSession) {
      // 最新のセッションをアクティブに設定
      setActiveSession(sessions[0].id);
    }
  }, [sessions, isLoading, error]);

  // 新しいセッションを作成
  const createNewSession = async () => {
    try {
      const res = await apiRequest("POST", "/api/chat/sessions", {
        title: `セッション ${new Date().toLocaleDateString('ja-JP')}`
      });
      
      if (res.ok) {
        const newSession = await res.json();
        // キャッシュを更新するために再取得が必要
        window.location.reload();
      }
    } catch (error) {
      console.error("セッション作成エラー:", error);
      toast({
        title: "エラー",
        description: "新しいセッションを作成できませんでした",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container py-6 space-y-6 max-w-6xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AIコーチングセッション</h1>
        <p className="text-muted-foreground">
          あなたの心の状態や課題について、AIコーチと対話しながら解決策を見つけましょう。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="session-select">セッション</Label>
              <div className="flex items-center gap-2 mt-2">
                <select
                  id="session-select"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={activeSession || ""}
                  onChange={(e) => setActiveSession(parseInt(e.target.value))}
                  disabled={isLoading || !sessions || sessions.length === 0}
                >
                  {isLoading ? (
                    <option>読み込み中...</option>
                  ) : !sessions || sessions.length === 0 ? (
                    <option>セッションがありません</option>
                  ) : (
                    sessions.map((session: any) => (
                      <option key={session.id} value={session.id}>
                        {session.title || `セッション ${session.id}`}
                      </option>
                    ))
                  )}
                </select>
                <button
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                  onClick={createNewSession}
                >
                  新規セッション
                </button>
              </div>
            </div>

            <Tabs defaultValue="ai-coach" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ai-coach">AIコーチ</TabsTrigger>
                <TabsTrigger value="resources">利用方法</TabsTrigger>
              </TabsList>
              <TabsContent value="ai-coach" className="space-y-4">
                {activeSession ? (
                  <AIChat
                    sessionId={activeSession}
                    title="AIコーチングセッション"
                    description="あなたの状況や悩みを共有してください。AIコーチがサポートします。"
                  />
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    セッションを選択するか、新しいセッションを作成してください。
                  </div>
                )}
              </TabsContent>
              <TabsContent value="resources">
                <div className="space-y-4 p-4">
                  <h3 className="text-lg font-medium">AIコーチングの利用方法</h3>
                  <div className="space-y-2">
                    <h4 className="font-medium">1. 正直に話す</h4>
                    <p>
                      効果的なコーチングセッションのためには、あなたの状況や感情を正直に共有することが重要です。
                      AIコーチは判断せず、理解しようと努めます。
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">2. 具体的な目標を設定する</h4>
                    <p>
                      「ストレスを減らしたい」よりも「仕事のプレゼンテーションに対する不安を軽減したい」というように、
                      具体的な課題や目標を設定すると、より効果的なアドバイスを受けられます。
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">3. 質問する</h4>
                    <p>
                      疑問や不明点があれば、遠慮なく質問してください。
                      AIコーチとの対話を通じて、新しい視点や解決策を見つけることができます。
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">4. 継続する</h4>
                    <p>
                      メンタルヘルスの改善は一朝一夕にはできません。定期的にセッションを行い、
                      進捗を振り返ることで、効果的な変化を促すことができます。
                    </p>
                  </div>
                  <div className="mt-4 p-4 bg-muted rounded-md">
                    <p className="text-sm">
                      <strong>注意:</strong> AIコーチは専門的な医療アドバイスや診断を提供することはできません。
                      深刻な症状がある場合は、必ず医療専門家に相談してください。
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </div>
  );
}
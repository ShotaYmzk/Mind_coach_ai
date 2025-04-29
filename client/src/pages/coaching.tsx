import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import ChatInterface from "@/components/chat-interface";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, MessageSquare, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Coaching() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("chat");
  const [newSessionTitle, setNewSessionTitle] = useState("");
  
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);
  
  // Fetch chat sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/chat/sessions"],
    enabled: !!user,
  });
  
  // Create a new session
  const { mutate: createSession, isPending: isCreatingSession } = useMutation({
    mutationFn: async (title: string) => {
      return apiRequest("POST", "/api/chat/sessions", {
        title,
        userId: user?.id,
      });
    },
    onSuccess: () => {
      setNewSessionTitle("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
    },
  });
  
  // Handle new session creation
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSessionTitle.trim()) {
      createSession(newSessionTitle);
    }
  };
  
  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-primary-200 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-primary-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-primary-200 rounded"></div>
              <div className="h-4 bg-primary-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-2">AIコーチング</h1>
        <p className="text-neutral-600 max-w-2xl mb-4">
          あなたの考え、感情、目標についてAIコーチと会話しましょう。どんな気持ちでも、あなたの声に耳を傾け、ガイダンスを提供します。
        </p>
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-5 mt-4 mb-6 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-white p-2 rounded-full shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-amber-900 font-medium text-lg mb-1">人間のプロフェッショナルコーチにアップグレード</h3>
              <p className="text-amber-800 text-sm mb-3">AIサポートに加えて、より深いガイダンスと個別化されたサポートを受けられます。専門資格を持つコーチがあなたの目標達成をサポートします。</p>
              <Link href="/reservation" className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors">
                今すぐセッションを予約する <span className="ml-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">セッション</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSession} className="mb-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="新しいセッション名"
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    disabled={isCreatingSession}
                  />
                  <Button type="submit" size="sm" disabled={isCreatingSession || !newSessionTitle.trim()}>
                    追加
                  </Button>
                </div>
              </form>
              
              <div className="space-y-2">
                {sessionsLoading ? (
                  <>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </>
                ) : sessions?.length > 0 ? (
                  sessions.map((session: any) => (
                    <Button
                      key={session.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveTab("history");
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {session.title}
                    </Button>
                  ))
                ) : (
                  <div className="text-center py-4 text-neutral-500 text-sm">
                    セッションはまだありません
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary-100 p-2 rounded-md">
                    <Brain className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-neutral-900">AIコーチの特徴</h3>
                    <p className="mt-1 text-xs text-neutral-500">
                      AIコーチは非判断的で共感的なサポートを提供します。医療アドバイスではなく、メンタルヘルスと幸福感向上のためのガイダンスを提供します。
                    </p>
                  </div>
                </div>
                
                <div className="text-xs text-neutral-500 border-t border-neutral-200 pt-3 mt-3">
                  <p>医学的アドバイスとして解釈しないでください。深刻な状態には専門家に相談してください。</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="chat">新しいチャット</TabsTrigger>
              <TabsTrigger value="history">セッション履歴</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat">
              <ChatInterface
                title="AIコーチとの新しい会話"
                description="あなたの状況や気持ちを共有して、パーソナライズされたサポートを受けましょう"
              />
            </TabsContent>
            
            <TabsContent value="history">
              {sessions?.length > 0 ? (
                <ChatInterface
                  sessionId={sessions[0].id}
                  title={sessions[0].title}
                  description={`作成日: ${new Date(sessions[0].createdAt).toLocaleDateString('ja-JP')}`}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <History className="h-12 w-12 text-neutral-400 mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 mb-2">セッション履歴がまだありません</h3>
                    <p className="text-neutral-500 text-center max-w-md mb-4">
                      新しいチャットを開始して、AIコーチとのセッションを記録しましょう。
                    </p>
                    <Button
                      onClick={() => setActiveTab("chat")}
                    >
                      新しいチャットを開始
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

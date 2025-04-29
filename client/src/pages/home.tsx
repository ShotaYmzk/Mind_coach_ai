import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import StatCard from "@/components/stat-card";
import MoodTracker from "@/components/mood-tracker";
import ChatInterface from "@/components/chat-interface";
import ProfileCard from "@/components/profile-card";
import { ResourcesList } from "@/components/resource-card";
import { useQuery } from "@tanstack/react-query";
import { BrainCog, CalendarCheck, Activity } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);
  
  // Fetch resources
  const { data: resources = [] } = useQuery({
    queryKey: ["/api/resources"],
  });
  
  // Get mood entries to calculate streak
  const { data: moodEntries = [] } = useQuery({
    queryKey: ["/api/mood"],
    enabled: !!user,
  });
  
  // Get latest assessment for mindfulness score
  const { data: assessments = [] } = useQuery({
    queryKey: ["/api/assessment/history"],
    enabled: !!user,
  });
  
  // Calculate streak (simplified)
  const streak = moodEntries?.length > 0 ? Math.min(moodEntries.length, 14) : 0;
  
  // Get latest assessment score
  const latestAssessment = assessments?.length > 0 ? assessments[0] : null;
  const mindfulnessScore = latestAssessment ? `${latestAssessment.score}/100` : "未評価";
  
  if (isLoading) {
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
  
  if (!user) {
    return null; // Will redirect in the useEffect
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
      <div className="py-6">
        <h1 className="text-2xl font-heading font-semibold text-neutral-900 mb-1">
          こんにちは、{user.name}さん
        </h1>
        <p className="text-neutral-600">今日はどのようにお手伝いできますか？</p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatCard
          title="継続日数"
          value={`${streak}日`}
          icon={<CalendarCheck className="h-5 w-5" />}
          iconBgColor="bg-primary-100"
          iconTextColor="text-primary-500"
          footer={{
            text: "詳細を見る",
            link: "/stats",
          }}
        />
        
        <StatCard
          title="マインドフルネススコア"
          value={mindfulnessScore}
          icon={<BrainCog className="h-5 w-5" />}
          iconBgColor="bg-secondary-100"
          iconTextColor="text-secondary-500"
          footer={{
            text: "詳細を見る",
            link: "/assessment",
          }}
        />
        
        <StatCard
          title="次回のセッション"
          value="予約なし"
          icon={<Activity className="h-5 w-5" />}
          iconBgColor="bg-accent-100"
          iconTextColor="text-accent-500"
          footer={{
            text: "スケジュールを変更",
            link: "/schedule",
          }}
        />
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Welcome Card */}
          <Card className="bg-gradient-to-r from-primary-500 to-primary-600 shadow-card overflow-hidden">
            <CardContent className="px-6 py-8 md:px-8 md:flex md:items-center">
              <div className="md:flex-1">
                <h2 className="text-xl font-heading font-bold text-white leading-tight mb-2">
                  AIコーチングを始めましょう
                </h2>
                <p className="text-primary-100 mb-4">
                  あなただけのパーソナルAIコーチがメンタルヘルスをサポートします。今日の気分を教えてみませんか？
                </p>
                <div>
                  <Link href="/coaching">
                    <Button
                      className="inline-flex items-center px-5 py-2 text-primary-700 bg-white hover:bg-primary-50"
                    >
                      チャットを始める <span className="ml-2">→</span>
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:block w-32 h-32 mt-4 md:mt-0">
                <img
                  src="https://images.unsplash.com/photo-1579869847557-1f67382cc158?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80"
                  alt="メンタルヘルス"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Mood Tracker */}
          <MoodTracker />
          
          {/* Chat Interface */}
          <ChatInterface
            title="最近のコーチングセッション"
            description="AIコーチとの最近の会話"
          />
        </div>
        
        {/* Right Column */}
        <div className="col-span-1 space-y-6">
          {/* Profile Card */}
          <ProfileCard />
          
          {/* Next Assessment */}
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-accent-100 flex items-center justify-center">
                        <BrainCog className="h-5 w-5 text-accent-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-neutral-900">週間ストレスチェック</h4>
                      <p className="text-xs text-neutral-500">約5分</p>
                    </div>
                  </div>
                  <span className="bg-accent-100 text-accent-800 text-xs px-2 py-1 rounded-full">
                    推奨
                  </span>
                </div>
              </div>
              <Link href="/assessment">
                <Button
                  className="w-full bg-accent-500 hover:bg-accent-600"
                >
                  今すぐ始める
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* Resources */}
          <Card className="shadow-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-heading font-medium text-neutral-900 mb-4">
                おすすめリソース
              </h3>
              <ResourcesList resources={resources.slice(0, 3)} />
            </CardContent>
          </Card>

          {/* Human Coaching Promotion */}
          <Card className="shadow-card bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-amber-900">人間のコーチとセッション</h4>
                  <p className="text-xs text-amber-700">パーソナライズされたサポート</p>
                </div>
              </div>
              <p className="text-sm text-amber-800 mb-4">
                専門的な資格を持つコーチによる1対1の相談で、より深いサポートを受けられます。
              </p>
              <Link href="/reservation">
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
                >
                  予約する
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

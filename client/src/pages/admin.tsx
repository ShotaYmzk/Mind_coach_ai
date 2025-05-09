import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { UserCog, CalendarClock, UserCheck, ChevronRight, BarChart3, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

type Reservation = {
  id: number;
  userId: number;
  coachId: number;
  date: string; // ISO形式の日付文字列
  status: string;
  notes: string | null;
  duration: number;
  meetingUrl: string | null;
  createdAt: string; // ISO形式の日付文字列
  
  // フロントエンドでの表示用に追加
  userName?: string; 
  coachName?: string;
};

type Coach = {
  id: number;
  name: string;
  email: string;
  specialty: string;
  bio: string;
  imageUrl: string | null;
  availability: string; // JSON文字列
  isActive: boolean;
  createdAt: string; // ISO形式の日付文字列
};

type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  location: string | null;
  avatarUrl: string | null;
  planType: string;
  createdAt: string; // ISO形式の日付文字列
};

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("reservations");
  const { toast } = useToast();
  
  // ユーザーがログインしておらず、管理者でない場合はリダイレクト
  useEffect(() => {
    if (!authLoading && (!user || user.planType !== "admin")) {
      window.location.href = "/";
      toast({
        title: "アクセス権限がありません",
        description: "管理者ページにアクセスする権限がありません。",
        variant: "destructive",
      });
    }
  }, [user, authLoading, toast]);

  // 予約情報を取得
  const { data: reservations, isLoading: reservationsLoading } = useQuery({
    queryKey: ["/api/admin/reservations"],
    queryFn: async () => {
      const response = await fetch("/api/admin/reservations");
      if (!response.ok) {
        throw new Error("Failed to fetch reservations");
      }
      return response.json();
    },
    enabled: !!user && user.planType === "admin"
  });

  // コーチ情報を取得
  const { data: coaches, isLoading: coachesLoading } = useQuery({
    queryKey: ["/api/admin/coaches"],
    queryFn: async () => {
      const response = await fetch("/api/admin/coaches");
      if (!response.ok) {
        throw new Error("Failed to fetch coaches");
      }
      return response.json();
    },
    enabled: !!user && user.planType === "admin"
  });

  // ユーザー情報を取得
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
    enabled: !!user && user.planType === "admin"
  });

  // 予約ステータスを更新する関数
  const updateReservationStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/reservations/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update reservation status");
      }

      toast({
        title: "予約ステータスを更新しました",
        description: `予約ID: ${id} のステータスが ${status} に更新されました。`,
      });
      
      // キャッシュを無効化して再フェッチ
      // queryClient.invalidateQueries({ queryKey: ["/api/admin/reservations"] });
    } catch (error) {
      console.error("Error updating reservation status:", error);
      toast({
        title: "エラーが発生しました",
        description: "予約ステータスの更新に失敗しました。",
        variant: "destructive",
      });
    }
  };

  // 予約ステータスに応じたバッジを表示する関数
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">保留中</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">確認済み</Badge>;
      case "canceled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">キャンセル</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">完了</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 日時をフォーマットする関数
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyy年MM月dd日(E) HH:mm", { locale: ja });
  };

  // コンテンツ読み込み中の表示
  if (authLoading || !user || user.planType !== "admin") {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>管理者ダッシュボード</CardTitle>
              <CardDescription>メンタルAIの管理機能へようこそ</CardDescription>
            </div>
            <UserCog className="h-8 w-8 text-primary-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">総予約数</p>
                <p className="text-2xl font-bold text-primary-700">
                  {reservationsLoading ? <Skeleton className="h-8 w-16" /> : reservations?.length || 0}
                </p>
              </div>
              <CalendarClock className="h-10 w-10 text-primary-400" />
            </div>
            
            <div className="bg-primary-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">アクティブコーチ</p>
                <p className="text-2xl font-bold text-primary-700">
                  {coachesLoading 
                    ? <Skeleton className="h-8 w-16" /> 
                    : coaches?.filter((coach: Coach) => coach.isActive).length || 0}
                </p>
              </div>
              <UserCheck className="h-10 w-10 text-primary-400" />
            </div>
            
            <div className="bg-primary-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">総ユーザー数</p>
                <p className="text-2xl font-bold text-primary-700">
                  {usersLoading ? <Skeleton className="h-8 w-16" /> : users?.length || 0}
                </p>
              </div>
              <BarChart3 className="h-10 w-10 text-primary-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="reservations">予約管理</TabsTrigger>
          <TabsTrigger value="coaches">コーチ管理</TabsTrigger>
          <TabsTrigger value="users">ユーザー管理</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reservations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>予約一覧</CardTitle>
              <CardDescription>全ての予約を管理し、ステータスを更新します</CardDescription>
            </CardHeader>
            <CardContent>
              {reservationsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : reservations?.length > 0 ? (
                <div className="space-y-4">
                  {reservations.map((reservation: Reservation) => (
                    <div 
                      key={reservation.id} 
                      className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar>
                            <AvatarImage src={users?.find((u: User) => u.id === reservation.userId)?.avatarUrl || ""} />
                            <AvatarFallback>{users?.find((u: User) => u.id === reservation.userId)?.name.slice(0, 2) || "?"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {users?.find((u: User) => u.id === reservation.userId)?.name || "ユーザー不明"}
                            </p>
                            <p className="text-sm text-neutral-500">
                              コーチ: {coaches?.find((c: Coach) => c.id === reservation.coachId)?.name || "コーチ不明"}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-neutral-500">日時</p>
                            <p>{formatDateTime(reservation.date)}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">予約ID</p>
                            <p>{reservation.id}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-neutral-500">ステータス:</p>
                          {getStatusBadge(reservation.status)}
                        </div>
                        
                        <div className="flex gap-2">
                          {reservation.status !== "confirmed" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={() => updateReservationStatus(reservation.id, "confirmed")}
                            >
                              確認
                            </Button>
                          )}
                          
                          {reservation.status !== "canceled" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs text-red-500 hover:text-red-600"
                              onClick={() => updateReservationStatus(reservation.id, "canceled")}
                            >
                              キャンセル
                            </Button>
                          )}
                          
                          {reservation.status !== "completed" && reservation.status !== "canceled" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={() => updateReservationStatus(reservation.id, "completed")}
                            >
                              完了
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarClock className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">予約がありません</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="coaches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>コーチ一覧</CardTitle>
              <CardDescription>登録コーチの情報と可用性を管理します</CardDescription>
            </CardHeader>
            <CardContent>
              {coachesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : coaches?.length > 0 ? (
                <div className="space-y-4">
                  {coaches.map((coach: Coach) => (
                    <div 
                      key={coach.id} 
                      className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={coach.imageUrl || ""} />
                          <AvatarFallback>{coach.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{coach.name}</p>
                          <p className="text-sm text-neutral-500">{coach.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:items-end">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={coach.isActive ? "default" : "outline"} className={coach.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-neutral-100 text-neutral-800"}>
                            {coach.isActive ? "アクティブ" : "非アクティブ"}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {coach.specialty === "anxiety" ? "不安障害" : 
                             coach.specialty === "depression" ? "うつ" :
                             coach.specialty === "career" ? "キャリア" : coach.specialty}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1">
                          詳細を表示 <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">コーチがいません</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ユーザー一覧</CardTitle>
              <CardDescription>プラットフォームユーザーの管理と詳細確認</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : users?.length > 0 ? (
                <div className="space-y-4">
                  {users.map((user: User) => (
                    <div 
                      key={user.id} 
                      className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl || ""} />
                          <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-neutral-500">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:items-end">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={user.planType === "admin" ? "default" : "outline"} className={
                            user.planType === "admin" 
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-100" 
                              : user.planType === "premium" 
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-100" 
                                : "bg-neutral-100 text-neutral-800"
                          }>
                            {user.planType === "admin" ? "管理者" : 
                             user.planType === "premium" ? "プレミアム" : 
                             user.planType}
                          </Badge>
                          {user.location && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                              {user.location}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500">
                          登録日: {format(new Date(user.createdAt), "yyyy年MM月dd日", { locale: ja })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">ユーザーがいません</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
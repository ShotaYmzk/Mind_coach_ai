import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CalendarClock,
  Clock,
  MapPin,
  User,
  Video,
  UserCircle,
  CalendarX,
  CircleCheck,
  FileText,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

type Reservation = {
  id: number;
  userId: number;
  coachId: number;
  date: string;
  duration: number;
  status: string;
  notes: string | null;
  meetingUrl: string | null;
  createdAt: string;
  coachName?: string;
  coachSpecialty?: string;
};

type Coach = {
  id: number;
  name: string;
  specialty: string;
  imageUrl: string | null;
};

export default function Schedule() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cancelReservationId, setCancelReservationId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  // ユーザーの予約一覧を取得
  const {
    data: reservations = [],
    isLoading: reservationsLoading,
    isError: reservationsError,
  } = useQuery({
    queryKey: ["/api/reservations"],
    enabled: !!user,
  });

  // コーチ一覧を取得
  const {
    data: coaches = [],
    isLoading: coachesLoading,
  } = useQuery({
    queryKey: ["/api/coaches"],
    enabled: !!user,
  });

  // 予約をキャンセルする処理
  const { mutate: cancelReservation, isPending: cancelPending } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/reservations/${id}/status`, {
        status: "canceled",
      });
    },
    onSuccess: () => {
      toast({
        title: "予約をキャンセルしました",
        description: "コーチングセッションの予約がキャンセルされました。",
      });
      // 予約一覧を再取得
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
    },
    onError: (error) => {
      console.error("予約キャンセルエラー:", error);
      toast({
        title: "キャンセル失敗",
        description: "予約のキャンセル中にエラーが発生しました。",
        variant: "destructive",
      });
    },
  });

  const getCoachDetails = (coachId: number) => {
    return coaches.find((coach: Coach) => coach.id === coachId) || null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">保留中</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">確定</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">完了</Badge>;
      case "canceled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">キャンセル</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 日付をフォーマット
  const formatDateTime = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, "yyyy年MM月dd日(E) HH:mm", { locale: ja });
  };

  // 予約を日付でソート (最新のものが上)
  const sortedReservations = [...reservations].sort((a: Reservation, b: Reservation) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // 予約をステータスで分類
  const upcomingReservations = sortedReservations.filter(
    (res: Reservation) => res.status === "confirmed" || res.status === "pending"
  );
  
  const pastReservations = sortedReservations.filter(
    (res: Reservation) => res.status === "completed" || res.status === "canceled"
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">
          <div className="h-12 w-12 bg-primary-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
      <div className="py-6">
        <h1 className="text-2xl font-heading font-semibold text-neutral-900 mb-1">
          コーチング予約管理
        </h1>
        <p className="text-neutral-600">
          あなたのコーチングセッションの予約状況と履歴を管理できます
        </p>
      </div>

      {reservationsLoading || coachesLoading ? (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-[250px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : reservationsError ? (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="h-5 w-5 mr-2" />
              データの取得中にエラーが発生しました
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              予約情報の取得中に問題が発生しました。後でもう一度お試しいただくか、サポートにお問い合わせください。
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/reservations"] })}
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-100"
            >
              再試行
            </Button>
          </CardFooter>
        </Card>
      ) : sortedReservations.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>予約がありません</CardTitle>
            <CardDescription>
              コーチングセッションを予約して、専門家からサポートを受けましょう
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <CalendarClock className="h-16 w-16 text-neutral-300 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-1">
                予約が見つかりません
              </h3>
              <p className="text-neutral-600 mb-4 max-w-md">
                あなたには現在予約されたコーチングセッションがありません。
                新しいセッションを予約して、専門家からサポートを受けましょう。
              </p>
              <Button asChild>
                <Link href="/reservation">予約を作成</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 今後の予約 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarClock className="h-5 w-5 mr-2 text-primary-600" />
                今後の予約
              </CardTitle>
              <CardDescription>
                確定済みおよび保留中のコーチングセッション
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingReservations.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-neutral-600">
                    今後の予約はありません。
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/reservation">新しい予約を作成</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingReservations.map((reservation: Reservation) => {
                    const coach = getCoachDetails(reservation.coachId);
                    return (
                      <Card key={reservation.id} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="p-4 md:p-6 flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              {getStatusBadge(reservation.status)}
                              <h3 className="text-lg font-semibold">
                                {coach ? coach.specialty : "コーチングセッション"}
                              </h3>
                            </div>
                            <div className="space-y-3 mt-3">
                              <div className="flex items-start">
                                <CalendarClock className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                                <div>
                                  <p className="font-medium">日時</p>
                                  <p className="text-neutral-600">
                                    {formatDateTime(reservation.date)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <Clock className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                                <div>
                                  <p className="font-medium">時間</p>
                                  <p className="text-neutral-600">
                                    {reservation.duration}分
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <UserCircle className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                                <div>
                                  <p className="font-medium">コーチ</p>
                                  <p className="text-neutral-600">
                                    {coach ? coach.name : "未割り当て"}
                                  </p>
                                </div>
                              </div>
                              {reservation.notes && (
                                <div className="flex items-start">
                                  <FileText className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium">メモ</p>
                                    <p className="text-neutral-600">
                                      {reservation.notes}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="bg-neutral-50 p-4 md:p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-neutral-200">
                            <div className="mb-4">
                              {reservation.status === "confirmed" ? (
                                <div className="mb-4">
                                  <p className="text-sm font-medium mb-1">
                                    参加リンク
                                  </p>
                                  {reservation.meetingUrl ? (
                                    <Button
                                      asChild
                                      className="w-full"
                                      variant="outline"
                                    >
                                      <a
                                        href={reservation.meetingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center"
                                      >
                                        <Video className="h-4 w-4 mr-2" />
                                        ミーティングに参加
                                      </a>
                                    </Button>
                                  ) : (
                                    <p className="text-sm text-neutral-500">
                                      ミーティングリンクは予約確定後に表示されます
                                    </p>
                                  )}
                                </div>
                              ) : null}
                            </div>
                            <div className="mt-auto">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                                    onClick={() => setCancelReservationId(reservation.id)}
                                  >
                                    <CalendarX className="h-4 w-4 mr-2" />
                                    予約をキャンセル
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      予約をキャンセルしますか？
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      この操作は取り消せません。予約をキャンセルすると、予約枠は他のユーザーが利用できるようになります。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        if (cancelReservationId !== null) {
                                          cancelReservation(cancelReservationId);
                                        }
                                      }}
                                      disabled={cancelPending}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {cancelPending ? "処理中..." : "予約をキャンセル"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t border-neutral-200 pt-4">
              <Button asChild variant="outline">
                <Link href="/reservation">新しい予約を作成</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* 過去の予約履歴 */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="history">
              <AccordionTrigger className="px-4 py-2 bg-neutral-50 rounded-md">
                <span className="flex items-center text-neutral-700">
                  <ClockRewind className="h-5 w-5 mr-2 text-neutral-500" />
                  過去の予約履歴
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                {pastReservations.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-neutral-600">過去の予約はありません。</p>
                  </div>
                ) : (
                  <Table>
                    <TableCaption>過去のコーチングセッション履歴</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>日時</TableHead>
                        <TableHead>コーチ</TableHead>
                        <TableHead>専門分野</TableHead>
                        <TableHead>ステータス</TableHead>
                        <TableHead className="text-right">時間</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastReservations.map((reservation: Reservation) => {
                        const coach = getCoachDetails(reservation.coachId);
                        return (
                          <TableRow key={reservation.id}>
                            <TableCell>
                              {formatDateTime(reservation.date)}
                            </TableCell>
                            <TableCell>
                              {coach ? coach.name : "未割り当て"}
                            </TableCell>
                            <TableCell>
                              {coach ? coach.specialty : "-"}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(reservation.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              {reservation.duration}分
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
}

// ClockRewindアイコンの定義
function ClockRewind(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
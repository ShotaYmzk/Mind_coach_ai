import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, UserIcon, Clock, Phone, Calendar as CalendarIcon2 } from "lucide-react";

const reservationSchema = z.object({
  date: z.date({
    required_error: "予約日を選択してください",
  }),
  time: z.string({
    required_error: "予約時間を選択してください",
  }),
  coachType: z.string({
    required_error: "コーチタイプを選択してください",
  }),
  name: z.string().min(1, "お名前を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

// 時間スロットのリスト
const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

// コーチタイプ
const coachTypes = [
  { id: "mental_health", name: "メンタルヘルス専門家", price: "¥15,000" },
  { id: "psychologist", name: "心理カウンセラー", price: "¥12,000" },
  { id: "career", name: "キャリアコーチ", price: "¥10,000" },
  { id: "life", name: "ライフコーチ", price: "¥8,000" },
];

export default function Reservation() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [selectedCoachType, setSelectedCoachType] = useState(coachTypes[0]);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      date: undefined,
      time: "",
      coachType: "mental_health",
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      notes: "",
    },
  });

  // Update form values when user data loads
  useEffect(() => {
    if (user) {
      form.setValue("name", user.name);
      form.setValue("email", user.email);
    }
  }, [user, form]);

  // Handle coach type change
  const handleCoachTypeChange = (value: string) => {
    const coach = coachTypes.find(c => c.id === value);
    if (coach) {
      setSelectedCoachType(coach);
    }
  };

  async function onSubmit(data: ReservationFormValues) {
    setIsSubmitting(true);
    try {
      // Simulate API call for reservation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "予約リクエストを送信しました",
        description: `${format(data.date, "yyyy年MM月dd日")} ${data.time}に${selectedCoachType.name}との予約が申請されました。確認メールをお送りします。`,
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "エラー",
        description: "予約の送信中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

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
        <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-2">人間のコーチとセッションを予約</h1>
        <p className="text-neutral-600">
          AIだけでなく、専門家による直接的なサポートを受けることで、より深い洞察や個別のガイダンスを得ることができます。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>セッション予約</CardTitle>
              <CardDescription>
                以下のフォームにご記入ください。専門家との対面またはオンラインセッションを予約できます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>日付</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                                >
                                  {field.value ? (
                                    format(field.value, "yyyy年MM月dd日")
                                  ) : (
                                    <span>日付を選択</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => {
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  return date < today || date > new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>時間</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="時間を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="coachType"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>コーチタイプ</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleCoachTypeChange(value);
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="コーチタイプを選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {coachTypes.map((coach) => (
                                <SelectItem key={coach.id} value={coach.id}>
                                  {coach.name} - {coach.price}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>お名前</FormLabel>
                          <FormControl>
                            <Input placeholder="お名前" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>メールアドレス</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="メールアドレス" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>電話番号（任意）</FormLabel>
                          <FormControl>
                            <Input placeholder="電話番号" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div></div> {/* Empty div for grid alignment */}

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>追加メモ（任意）</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="話し合いたいトピックや質問があれば記入してください" 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "送信中..." : "セッションを予約する"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">予約詳細</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-primary-100 p-2 rounded-md">
                  <UserIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-neutral-900">{selectedCoachType.name}</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    セッション料金: {selectedCoachType.price} / 1時間
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-secondary-100 p-2 rounded-md">
                  <Clock className="h-5 w-5 text-secondary-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-neutral-900">セッション時間</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    1回のセッションは約50分間です
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-accent-100 p-2 rounded-md">
                  <CalendarIcon2 className="h-5 w-5 text-accent-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-neutral-900">キャンセルポリシー</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    予約の24時間前までのキャンセルは無料です。それ以降は50%のキャンセル料が発生します。
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-neutral-200 pt-4">
              <div className="text-xs text-neutral-500 w-full">
                <p>注意: 予約後、確認メールが送信されます。セッションの詳細とZoomリンクが含まれています。</p>
              </div>
            </CardFooter>
          </Card>

          <Card className="shadow-card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">専門家によるサポート</h3>
              <p className="text-primary-100 text-sm mb-4">
                人間のコーチは、より複雑な問題や特定の状況に対して、個別のガイダンスとサポートを提供します。
              </p>
              <div className="bg-white/20 rounded-md p-3 backdrop-blur-sm">
                <p className="text-white text-xs">
                  「専門家のコーチングセッションは私の考え方を大きく変え、具体的な行動計画を立てる助けになりました。」
                </p>
                <p className="text-white/80 text-xs mt-2 font-medium">- 田中さん、40歳</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
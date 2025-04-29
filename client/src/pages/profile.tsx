import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Settings, Shield, CreditCard } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  location: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      location: user?.location || "",
    },
    values: {
      name: user?.name || "",
      email: user?.email || "",
      location: user?.location || "",
    },
  });
  
  // Update form values when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        location: user.location || "",
      });
    }
  }, [user, form]);
  
  async function onSubmit(data: ProfileFormValues) {
    setIsSubmitting(true);
    try {
      // Simulating API call for profile update since we don't have that endpoint yet
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "プロフィールを更新しました",
        description: "変更が正常に保存されました。",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "プロフィールの更新中にエラーが発生しました。",
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
        <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-2">アカウント設定</h1>
        <p className="text-neutral-600">
          アカウント情報、プロフィール、プライバシー設定を管理します。
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 mb-3">
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=128&h=128&q=80" alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-medium text-center">{user.name}</h2>
                <p className="text-sm text-neutral-500">{user.planType || "プレミアム"}プラン</p>
              </div>
              
              <div className="space-y-1">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="#profile">
                    <User className="h-4 w-4 mr-2" />
                    プロフィール
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="#security">
                    <Shield className="h-4 w-4 mr-2" />
                    セキュリティ
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="#billing">
                    <CreditCard className="h-4 w-4 mr-2" />
                    支払い
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="#settings">
                    <Settings className="h-4 w-4 mr-2" />
                    アプリ設定
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          <Tabs defaultValue="profile">
            <TabsList className="mb-4">
              <TabsTrigger value="profile">プロフィール</TabsTrigger>
              <TabsTrigger value="security">セキュリティ</TabsTrigger>
              <TabsTrigger value="privacy">プライバシー</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>プロフィール情報</CardTitle>
                  <CardDescription>
                    あなたの個人情報を更新します
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="space-y-4">
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
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>所在地（任意）</FormLabel>
                              <FormControl>
                                <Input placeholder="例: 東京都" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="mt-6">
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "保存中..." : "変更を保存"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>セキュリティ設定</CardTitle>
                  <CardDescription>
                    パスワードと認証設定を管理します
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">パスワード変更</h3>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <FormLabel htmlFor="current-password">現在のパスワード</FormLabel>
                          <Input id="current-password" type="password" />
                        </div>
                        <div className="grid gap-2">
                          <FormLabel htmlFor="new-password">新しいパスワード</FormLabel>
                          <Input id="new-password" type="password" />
                        </div>
                        <div className="grid gap-2">
                          <FormLabel htmlFor="confirm-password">パスワード確認</FormLabel>
                          <Input id="confirm-password" type="password" />
                        </div>
                      </div>
                      <Button className="mt-4">パスワードを変更</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>プライバシー設定</CardTitle>
                  <CardDescription>
                    データとプライバシーの設定を管理します
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 mb-6">
                    MindCoach AIは、あなたのプライバシーを非常に重視しています。ここでは、データ使用に関する設定を管理できます。
                  </p>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                      <div>
                        <h3 className="font-medium">データ分析の許可</h3>
                        <p className="text-sm text-neutral-500">サービス改善のために匿名データを使用します</p>
                      </div>
                      <div className="form-control">
                        <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                      <div>
                        <h3 className="font-medium">メールマガジン</h3>
                        <p className="text-sm text-neutral-500">メンタルヘルスに関する最新情報を受け取ります</p>
                      </div>
                      <div className="form-control">
                        <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button variant="destructive">データを削除する</Button>
                      <p className="text-xs text-neutral-500 mt-2">
                        この操作は取り消せません。あなたのすべてのデータが完全に削除されます。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

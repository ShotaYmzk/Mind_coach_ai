import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AssessmentForm from "@/components/assessment-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCog, BarChart2, ArrowRight, CheckCircle, Brain, Activity, ThumbsUp } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export default function Assessment() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);
  
  // Fetch assessment history
  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ["/api/assessment/history"],
    enabled: !!user,
  });
  
  // 診断タイプ名を取得する関数
  const getAssessmentTypeName = (type: string) => {
    switch(type) {
      case "mental_health": return "総合メンタルヘルス診断";
      case "depression": return "うつ症状評価（PHQ-9）";
      case "anxiety": return "不安症状評価（GAD-7）";
      case "stress": return "ストレスチェック";
      case "burnout": return "バーンアウト評価";
      default: return type;
    }
  };
  
  // 診断結果の詳細を表示する関数
  const showAssessmentDetails = (assessment: any) => {
    setSelectedAssessment(assessment);
    setIsDialogOpen(true);
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
        <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-2">メンタルヘルス診断</h1>
        <p className="text-neutral-600 max-w-2xl">
          定期的な診断を通して、あなたのメンタルヘルス状態を把握し、パーソナライズされたサポートを受けましょう。
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="new">
            <TabsList className="mb-4">
              <TabsTrigger value="new">新しい診断</TabsTrigger>
              <TabsTrigger value="history">診断履歴</TabsTrigger>
            </TabsList>
            
            <TabsContent value="new">
              <AssessmentForm />
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>診断履歴</CardTitle>
                  <CardDescription>過去の診断結果を確認できます</CardDescription>
                </CardHeader>
                <CardContent>
                  {assessmentsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : assessments?.length > 0 ? (
                    <div className="space-y-4">
                      {assessments.map((assessment: any) => (
                        <div
                          key={assessment.id}
                          className="border border-neutral-200 rounded-md p-4 hover:bg-neutral-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-neutral-900">
                                {assessment.type === "mental_health" ? "メンタルヘルス診断" : assessment.type}
                              </h3>
                              <p className="text-sm text-neutral-500">
                                実施日: {format(new Date(assessment.createdAt), "yyyy年MM月dd日")}
                              </p>
                            </div>
                            <div className="bg-primary-100 text-primary-800 text-lg font-semibold px-3 py-1 rounded-full">
                              {assessment.score}/100
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-primary-600 hover:text-primary-700 p-0 h-auto"
                            onClick={() => showAssessmentDetails(assessment)}
                          >
                            詳細を見る <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BrainCog className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">診断履歴がありません</h3>
                      <p className="text-neutral-500 mb-4">
                        新しい診断を受けて、あなたのメンタルヘルス状態を把握しましょう。
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* 診断結果詳細ダイアログ */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              {selectedAssessment && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-xl flex items-center">
                      <BrainCog className="h-5 w-5 mr-2 text-primary-600" />
                      {getAssessmentTypeName(selectedAssessment.type)} 結果詳細
                    </DialogTitle>
                    <DialogDescription>
                      実施日: {format(new Date(selectedAssessment.createdAt), "yyyy年MM月dd日 HH:mm")}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 mt-4">
                    {/* スコア表示 */}
                    <div className="bg-neutral-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-neutral-700">総合スコア</h3>
                        <div className="text-2xl font-bold text-primary-700">{selectedAssessment.score}/100</div>
                      </div>
                      <Progress value={selectedAssessment.score} className="h-3" />
                      
                      <div className="text-sm text-neutral-500 mt-2 flex justify-between">
                        <span>要対応</span>
                        <span>注意</span>
                        <span>良好</span>
                      </div>
                    </div>
                    
                    {/* 結果サマリー */}
                    <div>
                      <h3 className="font-medium text-neutral-700 mb-2 flex items-center">
                        <Brain className="h-4 w-4 mr-2 text-primary-600" />
                        診断結果サマリー
                      </h3>
                      <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 text-neutral-700">
                        {selectedAssessment.summary}
                      </div>
                    </div>
                    
                    {/* 推奨アクション */}
                    <div>
                      <h3 className="font-medium text-neutral-700 mb-2 flex items-center">
                        <Activity className="h-4 w-4 mr-2 text-primary-600" />
                        推奨アクション
                      </h3>
                      <ul className="space-y-3">
                        {selectedAssessment.recommendations?.map((rec: string, idx: number) => (
                          <li key={idx} className="flex">
                            <CheckCircle className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-neutral-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* 回答詳細 */}
                    {selectedAssessment.results && (
                      <div>
                        <h3 className="font-medium text-neutral-700 mb-2 flex items-center">
                          <ThumbsUp className="h-4 w-4 mr-2 text-primary-600" />
                          回答詳細
                        </h3>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>質問</TableHead>
                                <TableHead className="w-32 text-right">回答</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(selectedAssessment.results).map(([key, value]: [string, any]) => (
                                <TableRow key={key}>
                                  <TableCell>{key}</TableCell>
                                  <TableCell className="text-right">{value}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter className="mt-6">
                    <Button onClick={() => setIsDialogOpen(false)} variant="outline">閉じる</Button>
                    <Button asChild>
                      <a href="/coaching">AIコーチングを始める</a>
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>診断について</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-primary-100 p-2 rounded-md">
                  <BrainCog className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-neutral-900">AIによる分析</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    あなたの回答を分析して、現在のメンタルヘルス状態を評価します。
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-secondary-100 p-2 rounded-md">
                  <BarChart2 className="h-5 w-5 text-secondary-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-neutral-900">進捗追跡</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    定期的な診断結果を比較して、あなたの成長と変化を追跡します。
                  </p>
                </div>
              </div>
              
              <div className="border-t border-neutral-200 pt-4 mt-4">
                <p className="text-sm text-neutral-600">
                  <strong>注意:</strong> この診断はスクリーニング目的のみであり、医学的診断や治療の代わりにはなりません。深刻な症状がある場合は、医療専門家に相談してください。
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>おすすめの次のステップ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a href="/coaching">
                  <BrainCog className="mr-2 h-4 w-4" />
                  AIコーチングセッションを始める
                </a>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a href="/resources">
                  <BrainCog className="mr-2 h-4 w-4" />
                  メンタルヘルスリソースを見る
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

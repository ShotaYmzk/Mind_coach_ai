import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCog } from "lucide-react";

type Question = {
  id: string;
  text: string;
  type: "select" | "scale";
  options?: string[];
  minLabel?: string;
  maxLabel?: string;
  category?: string;
};

type AssessmentType = {
  id: string;
  name: string;
  description: string;
};

export default function AssessmentForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showTypeSelection, setShowTypeSelection] = useState(true);
  
  // Fetch assessment types
  const { data: assessmentTypes, isLoading: typesLoading } = useQuery({
    queryKey: ["/api/assessment/question-types"],
  });
  
  // Fetch assessment questions based on selected type
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["/api/assessment/questions", selectedType],
    queryFn: async () => {
      const response = await fetch(`/api/assessment/questions${selectedType ? `?type=${selectedType}` : ''}`);
      if (!response.ok) throw new Error('質問の取得に失敗しました');
      return response.json();
    },
    enabled: !!selectedType,
  });
  
  // Submit assessment
  const { mutate: submitAssessment, isPending } = useMutation({
    mutationFn: async () => {
      try {
        // 認証情報付きでリクエスト送信
        const res = await fetch("/api/assessment/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            answers,
            type: selectedType 
          }),
          credentials: "include" // Cookie付きのリクエストを送信
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "送信中にエラーが発生しました");
        }
        
        return res.json();
      } catch (error) {
        console.error("Assessment submission error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setResult(data);
      setShowResults(true);
      toast({
        title: "評価が完了しました",
        description: "あなたの回答が正常に送信されました。",
      });
    },
    onError: (error: any) => {
      console.error("Submit error:", error);
      toast({
        title: "エラー",
        description: error.message || "評価の送信中にエラーが発生しました。ログインしているか確認してください。",
        variant: "destructive",
      });
    },
  });
  
  if (typesLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-32" />
        </CardFooter>
      </Card>
    );
  }
  
  if (questionsLoading && selectedType) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>質問を読み込み中...</CardTitle>
          <CardDescription>しばらくお待ちください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-32" />
        </CardFooter>
      </Card>
    );
  }
  
  if (!user) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>メンタルヘルス診断</CardTitle>
          <CardDescription>正確な診断を受けるには、ログインが必要です。</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <BrainCog className="h-16 w-16 text-primary-600 mx-auto mb-4" />
          <p className="mb-4">診断を受けて自分のメンタルヘルスを把握しましょう。</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <a href="/login">ログインする</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (showResults && result) {
    // 診断タイプに基づいてタイトルと説明を取得
    let resultTitle = "診断結果";
    let resultDescription = "あなたのメンタルヘルス診断の結果です";
    let scoreLabel = "スコア";
    let scoreComment = "";
    
    // スコアの色を決定（スコアによって異なる）
    let scoreColorClass = "bg-primary-100 text-primary-600";
    
    // 診断タイプによって表示を変更
    if (selectedType === "depression") {
      resultTitle = "うつ病スクリーニング (PHQ-9) 結果";
      resultDescription = "あなたのうつ症状の評価結果です";
      scoreLabel = "PHQ-9スコア";
      
      const score = result.analysis?.score;
      if (score >= 0 && score <= 4) {
        scoreColorClass = "bg-green-100 text-green-600";
        scoreComment = "症状なし〜軽度";
      } else if (score >= 5 && score <= 9) {
        scoreColorClass = "bg-yellow-100 text-yellow-600";
        scoreComment = "軽度〜中等度";
      } else if (score >= 10 && score <= 14) {
        scoreColorClass = "bg-orange-100 text-orange-600";
        scoreComment = "中等度";
      } else if (score >= 15 && score <= 19) {
        scoreColorClass = "bg-red-100 text-red-600";
        scoreComment = "中等度〜重度";
      } else if (score >= 20) {
        scoreColorClass = "bg-red-200 text-red-700";
        scoreComment = "重度";
      }
    } else if (selectedType === "anxiety") {
      resultTitle = "不安障害スクリーニング (GAD-7) 結果";
      resultDescription = "あなたの不安症状の評価結果です";
      scoreLabel = "GAD-7スコア";
      
      const score = result.analysis?.score;
      if (score >= 0 && score <= 4) {
        scoreColorClass = "bg-green-100 text-green-600";
        scoreComment = "症状なし〜軽度";
      } else if (score >= 5 && score <= 9) {
        scoreColorClass = "bg-yellow-100 text-yellow-600";
        scoreComment = "軽度";
      } else if (score >= 10 && score <= 14) {
        scoreColorClass = "bg-orange-100 text-orange-600";
        scoreComment = "中等度";
      } else if (score >= 15) {
        scoreColorClass = "bg-red-100 text-red-600";
        scoreComment = "重度";
      }
    } else if (selectedType === "stress") {
      resultTitle = "ストレスチェック結果";
      resultDescription = "あなたのストレスレベルの評価結果です";
      scoreLabel = "ストレススコア";
      
      const score = result.analysis?.score;
      if (score >= 0 && score <= 13) {
        scoreColorClass = "bg-green-100 text-green-600";
        scoreComment = "低ストレス";
      } else if (score >= 14 && score <= 26) {
        scoreColorClass = "bg-yellow-100 text-yellow-600";
        scoreComment = "中程度ストレス";
      } else if (score >= 27) {
        scoreColorClass = "bg-red-100 text-red-600";
        scoreComment = "高ストレス";
      }
    } else if (selectedType === "burnout") {
      resultTitle = "バーンアウト評価結果";
      resultDescription = "あなたの燃え尽き症候群リスクの評価結果です";
      scoreLabel = "バーンアウトスコア";
      
      const score = result.analysis?.score;
      if (score >= 0 && score <= 25) {
        scoreColorClass = "bg-green-100 text-green-600";
        scoreComment = "リスク低";
      } else if (score >= 26 && score <= 50) {
        scoreColorClass = "bg-yellow-100 text-yellow-600";
        scoreComment = "軽度リスク";
      } else if (score >= 51 && score <= 75) {
        scoreColorClass = "bg-orange-100 text-orange-600";
        scoreComment = "中等度リスク";
      } else if (score >= 76) {
        scoreColorClass = "bg-red-100 text-red-600";
        scoreComment = "高リスク";
      }
    }
    
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>{resultTitle}</CardTitle>
          <CardDescription>{resultDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`inline-flex flex-col items-center justify-center w-24 h-24 rounded-full ${scoreColorClass} mb-4`}>
              <span className="text-3xl font-bold">{result.analysis?.score}</span>
              {scoreComment && <span className="text-xs mt-1">{scoreComment}</span>}
            </div>
            <h3 className="text-xl font-semibold mb-2">分析概要</h3>
            <p className="text-neutral-600 mb-6">{result.analysis?.summary}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">おすすめのアクション</h3>
            <ul className="space-y-3">
              {result.analysis?.recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">
                    {index + 1}
                  </span>
                  <p className="text-neutral-700">{rec}</p>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setShowResults(false);
              setShowTypeSelection(true);
              setCurrentQuestionIndex(0);
              setSelectedType(null);
              setAnswers({});
            }}
            variant="outline"
          >
            別の診断を受ける
          </Button>
          <Button
            onClick={() => {
              setShowResults(false);
              setCurrentQuestionIndex(0);
              setAnswers({});
            }}
            variant="outline"
          >
            同じ診断をもう一度
          </Button>
          <Button asChild>
            <a href="/coaching">AIコーチングを始める</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // 診断タイプを選択する関数
  const handleSelectType = (type: string) => {
    setSelectedType(type);
    setShowTypeSelection(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
  };
  
  // 診断タイプの選択UIを表示
  if (showTypeSelection) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>メンタルヘルス診断の種類を選択</CardTitle>
          <CardDescription>
            あなたの現在の状態を評価するのに最適な診断を選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assessmentTypes?.map((type: AssessmentType) => (
              <div 
                key={type.id}
                className="border border-neutral-200 rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 cursor-pointer transition-colors"
                onClick={() => handleSelectType(type.id)}
              >
                <h3 className="font-medium text-lg text-neutral-900 mb-1">{type.name}</h3>
                <p className="text-sm text-neutral-600">{type.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!questions || questions.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>質問の読み込みエラー</CardTitle>
          <CardDescription>
            質問を読み込めませんでした。もう一度お試しください。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Button 
            onClick={() => setShowTypeSelection(true)}
            className="mt-4"
          >
            別の診断を選択する
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const currentQuestion: Question = questions[currentQuestionIndex];
  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitAssessment();
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      // 最初の質問で「前へ」を押すと診断タイプ選択に戻る
      setShowTypeSelection(true);
    }
  };
  
  const handleSelectAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };
  
  const handleScaleAnswer = (value: number[]) => {
    setAnswers({ ...answers, [currentQuestion.id]: value[0] });
  };
  
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isAnswered = answers[currentQuestion.id] !== undefined;
  
  // 診断タイプに基づいてタイトルと説明を設定
  let title = "メンタルヘルス診断";
  let description = "このアセスメントは約5分で完了します。あなたの現在の状態をより良く理解するためのものです。";
  
  if (selectedType === "depression") {
    title = "うつ病スクリーニング (PHQ-9)";
    description = "過去2週間のあなたの気分や行動について評価します。正直にお答えください。";
  } else if (selectedType === "anxiety") {
    title = "不安障害スクリーニング (GAD-7)";
    description = "過去2週間のあなたの不安症状について評価します。正直にお答えください。";
  } else if (selectedType === "stress") {
    title = "ストレスチェック";
    description = "過去1ヶ月間のあなたの感情や考えについて評価します。正直にお答えください。";
  } else if (selectedType === "burnout") {
    title = "バーンアウト評価";
    description = "仕事や日常生活におけるあなたの感情や状態について評価します。正直にお答えください。";
  }
  
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="mb-4 text-sm text-neutral-500">
            <div className="flex justify-between">
              <span>質問 {currentQuestionIndex + 1} / {questions.length}</span>
              {selectedType && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-auto p-0 text-neutral-500"
                  onClick={() => setShowTypeSelection(true)}
                >
                  別の診断を選択
                </Button>
              )}
            </div>
            <div className="w-full bg-neutral-100 h-1 mt-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary-500 h-full" 
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-neutral-900 mb-4">
              {currentQuestion.text}
            </h4>
            
            {currentQuestion.type === "select" && currentQuestion.options && (
              <RadioGroup
                value={answers[currentQuestion.id]?.toString() || ""}
                onValueChange={handleSelectAnswer}
                className="space-y-2"
              >
                {currentQuestion.options.map((option, i) => (
                  <div key={i} className="flex items-center">
                    <RadioGroupItem value={option} id={`q-${currentQuestion.id}-${i}`} />
                    <Label htmlFor={`q-${currentQuestion.id}-${i}`} className="ml-3 text-sm text-neutral-700">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            
            {currentQuestion.type === "scale" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-neutral-500">{currentQuestion.minLabel}</span>
                  <span className="text-xs text-neutral-500">{currentQuestion.maxLabel}</span>
                </div>
                <Slider
                  min={0}
                  max={3}
                  step={1}
                  value={answers[currentQuestion.id] !== undefined ? [answers[currentQuestion.id] as number] : [0]}
                  onValueChange={handleScaleAnswer}
                  className="w-full"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-neutral-400">0</span>
                  <span className="text-xs text-neutral-400">1</span>
                  <span className="text-xs text-neutral-400">2</span>
                  <span className="text-xs text-neutral-400">3</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 && !showTypeSelection}
        >
          {currentQuestionIndex === 0 ? "戻る" : "前へ"}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!isAnswered || isPending}
        >
          {isPending ? "送信中..." : isLastQuestion ? "完了" : "次へ"}
        </Button>
      </CardFooter>
    </Card>
  );
}

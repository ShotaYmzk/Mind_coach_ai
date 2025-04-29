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
};

export default function AssessmentForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Fetch assessment questions
  const { data: questions, isLoading } = useQuery({
    queryKey: ["/api/assessment/questions"],
  });
  
  // Submit assessment
  const { mutate: submitAssessment, isPending } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/assessment/submit", { answers });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      setShowResults(true);
      toast({
        title: "評価が完了しました",
        description: "あなたの回答が正常に送信されました。",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "評価の送信中にエラーが発生しました。",
        variant: "destructive",
      });
    },
  });
  
  if (isLoading) {
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
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>診断結果</CardTitle>
          <CardDescription>あなたのメンタルヘルス診断の結果です</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-100 mb-4">
              <span className="text-3xl font-bold text-primary-600">{result.analysis?.score}</span>
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
        <CardFooter>
          <Button
            onClick={() => {
              setShowResults(false);
              setCurrentQuestionIndex(0);
              setAnswers({});
            }}
            variant="outline"
            className="mr-2"
          >
            もう一度受ける
          </Button>
          <Button asChild>
            <a href="/coaching">AIコーチングを始める</a>
          </Button>
        </CardFooter>
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
  
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>メンタルヘルス診断</CardTitle>
        <CardDescription>
          このアセスメントは約5分で完了します。あなたの現在の状態をより良く理解するためのものです。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="mb-4 text-sm text-neutral-500">
            質問 {currentQuestionIndex + 1} / {questions.length}
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
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          前へ
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

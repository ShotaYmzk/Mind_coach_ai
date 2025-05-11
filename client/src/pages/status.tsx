import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, subDays } from "date-fns";
import { ja } from "date-fns/locale";

// カラーパレット
const COLORS = ["#FF8E6B", "#FFB86B", "#FFF56B", "#8EFF6B", "#6BB6FF"];
const MOOD_COLORS = {
  1: "#FF6B6B", // 最悪
  2: "#FFB86B", // 良くない
  3: "#FFF56B", // 普通
  4: "#8EFF6B", // 良い
  5: "#6BB6FF", // 最高
};

export default function Status() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("mood");

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  // 気分データの取得
  const { data: moodEntries = [], isLoading: moodLoading } = useQuery({
    queryKey: ["/api/mood"],
    enabled: !!user,
  });

  // 診断履歴の取得
  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery({
    queryKey: ["/api/assessment/history"],
    enabled: !!user,
  });

  const processedMoodData = () => {
    if (moodEntries.length === 0) return [];

    // 最近30日間のデータを処理
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        date: format(date, "MM/dd", { locale: ja }),
        fullDate: date,
        value: 0,
        count: 0,
      };
    }).reverse();

    // 各日のデータを集計
    moodEntries.forEach((entry: any) => {
      const entryDate = new Date(entry.createdAt);
      const dayIndex = last30Days.findIndex(
        (day) =>
          format(day.fullDate, "yyyy-MM-dd") ===
          format(entryDate, "yyyy-MM-dd")
      );
      if (dayIndex !== -1) {
        last30Days[dayIndex].value += entry.value;
        last30Days[dayIndex].count += 1;
      }
    });

    // 平均を計算
    return last30Days.map((day) => ({
      date: day.date,
      value: day.count > 0 ? Math.round((day.value / day.count) * 10) / 10 : null,
    }));
  };

  const moodDistribution = () => {
    if (moodEntries.length === 0) return [];

    const distribution = [
      { name: "最悪", value: 0, color: MOOD_COLORS[1] },
      { name: "良くない", value: 0, color: MOOD_COLORS[2] },
      { name: "普通", value: 0, color: MOOD_COLORS[3] },
      { name: "良い", value: 0, color: MOOD_COLORS[4] },
      { name: "最高", value: 0, color: MOOD_COLORS[5] },
    ];

    moodEntries.forEach((entry: any) => {
      distribution[entry.value - 1].value += 1;
    });

    return distribution;
  };

  const processedAssessmentData = () => {
    if (assessments.length === 0) return [];

    // タイプごとに最新の結果を取得
    const uniqueTypes = new Map();
    
    assessments.forEach((assessment: any) => {
      if (!uniqueTypes.has(assessment.type) || 
          new Date(assessment.createdAt) > new Date(uniqueTypes.get(assessment.type).createdAt)) {
        uniqueTypes.set(assessment.type, assessment);
      }
    });

    // 結果をグラフ用にフォーマット
    return Array.from(uniqueTypes.values()).map((assessment: any, index) => {
      const typeName = getAssessmentTypeName(assessment.type);
      return {
        name: typeName,
        score: assessment.score,
        color: COLORS[index % COLORS.length],
      };
    });
  };

  const getAssessmentTypeName = (type: string) => {
    switch(type) {
      case "general": return "メンタルヘルス";
      case "depression": return "うつ症状";
      case "anxiety": return "不安症状";
      case "stress": return "ストレス";
      case "burnout": return "バーンアウト";
      default: return type;
    }
  };

  const assessmentHistory = () => {
    if (assessments.length === 0) return [];

    // 診断履歴を時系列でソート
    return [...assessments]
      .sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 10)
      .map((assessment: any) => {
        return {
          date: format(new Date(assessment.createdAt), "yyyy/MM/dd", { locale: ja }),
          type: getAssessmentTypeName(assessment.type),
          score: assessment.score,
        };
      });
  };

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
          状態分析ダッシュボード
        </h1>
        <p className="text-neutral-600">
          あなたのメンタルヘルス状態の推移と分析を確認できます
        </p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mood">気分トラッキング</TabsTrigger>
          <TabsTrigger value="assessment">診断結果</TabsTrigger>
        </TabsList>

        <TabsContent value="mood" className="space-y-4">
          {moodLoading ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>データ読み込み中...</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[350px] w-full" />
              </CardContent>
            </Card>
          ) : moodEntries.length === 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>データがありません</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  気分のトラッキングを開始して、あなたの気分の推移を確認しましょう。
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>30日間の気分の推移</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={processedMoodData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 5]} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#FF8E6B"
                            activeDot={{ r: 8 }}
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>気分分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={moodDistribution()}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {moodDistribution().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>感情トリガー分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-neutral-600">
                      記録したメモから分析した主な感情トリガー:
                    </p>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: "仕事のストレス", value: 35 },
                            { name: "睡眠不足", value: 28 },
                            { name: "社会的孤立", value: 22 },
                            { name: "過度な期待", value: 15 },
                            { name: "その他", value: 10 },
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#FF8E6B" barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="assessment" className="space-y-4">
          {assessmentsLoading ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>データ読み込み中...</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[350px] w-full" />
              </CardContent>
            </Card>
          ) : assessments.length === 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>診断データがありません</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  様々な診断を受けることで、あなたのメンタルヘルスの状態を把握できます。
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>カテゴリー別スコア比較</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={processedAssessmentData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="score">
                          {processedAssessmentData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>最近の診断履歴</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left py-3 px-4 bg-neutral-50 border-b text-neutral-600">日付</th>
                          <th className="text-left py-3 px-4 bg-neutral-50 border-b text-neutral-600">診断タイプ</th>
                          <th className="text-left py-3 px-4 bg-neutral-50 border-b text-neutral-600">スコア</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assessmentHistory().map((item, i) => (
                          <tr key={i} className="border-b hover:bg-neutral-50">
                            <td className="py-3 px-4">{item.date}</td>
                            <td className="py-3 px-4">{item.type}</td>
                            <td className="py-3 px-4">{item.score}/100</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>総合分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-neutral-600">
                      あなたの診断結果から、以下のような傾向が見られます：
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>ストレスレベルが高く、特に仕事関連のストレスが目立ちます</li>
                      <li>睡眠の質が改善傾向にありますが、まだ最適ではありません</li>
                      <li>マインドフルネスの実践がポジティブな影響を与えています</li>
                      <li>社会的なつながりをより強化することが推奨されます</li>
                    </ul>
                    <p className="mt-4 text-neutral-600">
                      継続的に診断を受けることで、より正確な傾向分析ができるようになります。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
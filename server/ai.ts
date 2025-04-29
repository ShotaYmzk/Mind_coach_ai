import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Initialize Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "dummy-key");

// Helper function to create a new Gemini model instance with safety settings
function getGeminiModel() {
  return genAI.getGenerativeModel({
    model: "gemini-1.5-pro", // Using Gemini 1.5 Pro as it's the most capable model
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  });
}

export type AssessmentQuestion = {
  id: string;
  text: string;
  type: 'select' | 'scale';
  options?: string[];
  minLabel?: string;
  maxLabel?: string;
};

export type AssessmentResult = {
  score: number;
  summary: string;
  recommendations: string[];
};

export const mentalHealthQuestions: AssessmentQuestion[] = [
  {
    id: "q1",
    text: "最近、気分が落ち込んだり、憂鬱な気持ちになることがありますか？",
    type: "select",
    options: ["まったくない", "数日", "半分以上の日", "ほぼ毎日"]
  },
  {
    id: "q2",
    text: "物事に対する興味や楽しみが減少したと感じますか？",
    type: "scale",
    minLabel: "まったくない",
    maxLabel: "ほぼ毎日"
  },
  {
    id: "q3",
    text: "睡眠に問題がありますか？（寝つきが悪い、途中で目が覚める、または逆に眠りすぎる）",
    type: "select",
    options: ["まったくない", "数日", "半分以上の日", "ほぼ毎日"]
  },
  {
    id: "q4",
    text: "疲れていると感じたり、エネルギーが減少していると感じますか？",
    type: "scale",
    minLabel: "まったくない",
    maxLabel: "ほぼ毎日"
  },
  {
    id: "q5",
    text: "食欲不振や過食がありますか？",
    type: "select",
    options: ["まったくない", "数日", "半分以上の日", "ほぼ毎日"]
  },
  {
    id: "q6",
    text: "自分自身に対して悪く思ったり、自分が失敗者だと感じたり、自分や家族を落胆させたと感じることがありますか？",
    type: "scale",
    minLabel: "まったくない",
    maxLabel: "ほぼ毎日"
  },
  {
    id: "q7",
    text: "新聞を読んだりテレビを見たりなど、物事に集中することが難しいと感じますか？",
    type: "select",
    options: ["まったくない", "数日", "半分以上の日", "ほぼ毎日"]
  },
  {
    id: "q8",
    text: "他人が気づくほど動きや話し方が遅くなったり、反対に落ち着きがなく、普段よりもそわそわと動き回ることがありますか？",
    type: "scale",
    minLabel: "まったくない",
    maxLabel: "ほぼ毎日"
  },
  {
    id: "q9",
    text: "ストレスを感じる状況に直面したとき、どのように対処していますか？",
    type: "select",
    options: ["積極的に解決策を探す", "誰かに相談する", "避けるようにしている", "対処法がわからない"]
  },
  {
    id: "q10",
    text: "自分自身をケアするための時間を定期的に取っていますか？",
    type: "scale",
    minLabel: "まったくとっていない",
    maxLabel: "毎日取っている"
  }
];

export async function analyzeMentalHealthAssessment(
  answers: Record<string, number | string>
): Promise<AssessmentResult> {
  try {
    const model = getGeminiModel();
    const promptData = {
      questions: mentalHealthQuestions,
      answers: answers
    };

    const systemPrompt = "あなたはメンタルヘルスの専門家です。ユーザーの回答に基づいて、メンタルヘルス評価を行い、スコア（0-100）、総合的な分析、および改善のための3つの推奨事項を提供してください。";
    const userPrompt = `以下はユーザーのメンタルヘルス質問票への回答です。この回答を分析し、総合スコア（0-100、高いほど良好な状態）、全体的な健康状態の要約、および改善のための具体的な推奨事項を3つ提供してください。必ずJSON形式で回答してください。必要なフィールドは score (数値), summary (文字列), recommendations (文字列の配列) です。回答データ: ${JSON.stringify(promptData)}`;
    
    const prompt = `${systemPrompt}\n\n${userPrompt}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract JSON from the response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    let parsedResult: any = {};
    
    if (jsonMatch) {
      try {
        parsedResult = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Error parsing JSON from Gemini response:", e);
      }
    }
    
    return {
      score: parsedResult.score || 0,
      summary: parsedResult.summary || "分析を完了できませんでした。",
      recommendations: parsedResult.recommendations || ["しばらく時間をおいて再度お試しください。"]
    };
  } catch (error) {
    console.error("Error analyzing assessment:", error);
    return {
      score: 0,
      summary: "エラーが発生しました。後でもう一度お試しください。",
      recommendations: ["しばらく時間をおいて再度お試しください。"]
    };
  }
}

export async function getChatResponse(
  messages: { role: "user" | "assistant"; content: string }[],
  userId: number
): Promise<string> {
  try {
    const model = getGeminiModel();
    
    // System prompt to guide Gemini's behavior
    const systemPrompt = "あなたはMindCoach AIというメンタルヘルスアプリのコーチです。共感的で支持的な姿勢でユーザーをサポートします。メンタルヘルスのアドバイスを提供する際は、科学的な根拠に基づいた情報を心がけ、ユーザーの感情に寄り添いながらも、前向きな考え方や具体的な対処法を提案してください。医学的診断や治療は提供せず、深刻な問題の場合は専門家への相談を勧めます。";
    
    // Format conversation history for Gemini
    let formattedHistory = "";
    messages.forEach(msg => {
      const role = msg.role === "user" ? "ユーザー" : "アシスタント";
      formattedHistory += `${role}: ${msg.content}\n\n`;
    });
    
    const prompt = `${systemPrompt}\n\n会話履歴:\n${formattedHistory}\n\nあなたの応答:`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "応答を生成できませんでした。";
  } catch (error) {
    console.error("Error getting chat response:", error);
    return "申し訳ありません。エラーが発生しました。しばらくしてからもう一度お試しください。";
  }
}

export async function analyzeMoodEntry(
  rating: number,
  notes?: string
): Promise<string> {
  try {
    const model = getGeminiModel();
    
    const systemPrompt = "あなたはメンタルヘルスの専門家です。ユーザーの気分評価とメモに基づいて、簡潔な（50語以内）洞察を提供してください。";
    const userPrompt = `ユーザーの気分評価: ${rating}/10。${notes ? `ユーザーのメモ: ${notes}` : "メモはありません。"}`;
    
    const prompt = `${systemPrompt}\n\n${userPrompt}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "分析を完了できませんでした。";
  } catch (error) {
    console.error("Error analyzing mood:", error);
    return "気分の分析中にエラーが発生しました。";
  }
}

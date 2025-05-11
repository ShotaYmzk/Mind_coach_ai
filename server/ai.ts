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
  category?: string;
};

export type AssessmentResult = {
  score: number;
  summary: string;
  recommendations: string[];
};

// 一般的なメンタルヘルス評価質問
export const mentalHealthQuestions: AssessmentQuestion[] = [
  {
    id: "q1",
    text: "最近、気分が落ち込んだり、憂鬱な気持ちになることがありますか？",
    type: "select",
    options: ["まったくない", "数日", "半分以上の日", "ほぼ毎日"],
    category: "general"
  },
  {
    id: "q2",
    text: "物事に対する興味や楽しみが減少したと感じますか？",
    type: "scale",
    minLabel: "まったくない",
    maxLabel: "ほぼ毎日",
    category: "general"
  },
  {
    id: "q3",
    text: "睡眠に問題がありますか？（寝つきが悪い、途中で目が覚める、または逆に眠りすぎる）",
    type: "select",
    options: ["まったくない", "数日", "半分以上の日", "ほぼ毎日"],
    category: "general"
  },
  {
    id: "q4",
    text: "疲れていると感じたり、エネルギーが減少していると感じますか？",
    type: "scale",
    minLabel: "まったくない",
    maxLabel: "ほぼ毎日",
    category: "general"
  },
  {
    id: "q5",
    text: "食欲不振や過食がありますか？",
    type: "select",
    options: ["まったくない", "数日", "半分以上の日", "ほぼ毎日"],
    category: "general"
  },
  {
    id: "q6",
    text: "自分自身に対して悪く思ったり、自分が失敗者だと感じたり、自分や家族を落胆させたと感じることがありますか？",
    type: "scale",
    minLabel: "まったくない",
    maxLabel: "ほぼ毎日",
    category: "general"
  },
  {
    id: "q7",
    text: "新聞を読んだりテレビを見たりなど、物事に集中することが難しいと感じますか？",
    type: "select",
    options: ["まったくない", "数日", "半分以上の日", "ほぼ毎日"],
    category: "general"
  },
  {
    id: "q8",
    text: "他人が気づくほど動きや話し方が遅くなったり、反対に落ち着きがなく、普段よりもそわそわと動き回ることがありますか？",
    type: "scale",
    minLabel: "まったくない",
    maxLabel: "ほぼ毎日",
    category: "general"
  },
  {
    id: "q9",
    text: "ストレスを感じる状況に直面したとき、どのように対処していますか？",
    type: "select",
    options: ["積極的に解決策を探す", "誰かに相談する", "避けるようにしている", "対処法がわからない"],
    category: "general"
  },
  {
    id: "q10",
    text: "自分自身をケアするための時間を定期的に取っていますか？",
    type: "scale",
    minLabel: "まったくとっていない",
    maxLabel: "毎日取っている",
    category: "general"
  }
];

// PHQ-9 うつ病スクリーニング
export const depressionQuestions: AssessmentQuestion[] = [
  {
    id: "d1",
    text: "物事に対してほとんど興味がない、または楽しめない",
    type: "select",
    options: ["全くない", "数日", "半分以上", "ほぼ毎日"],
    category: "depression"
  },
  {
    id: "d2",
    text: "気分が落ち込む、憂鬱になる、または絶望的な気持ちになる",
    type: "select",
    options: ["全くない", "数日", "半分以上", "ほぼ毎日"],
    category: "depression"
  },
  {
    id: "d3",
    text: "寝付きが悪い、途中で目が覚める、または逆に眠り過ぎる",
    type: "select",
    options: ["全くない", "数日", "半分以上", "ほぼ毎日"],
    category: "depression"
  },
  {
    id: "d4",
    text: "疲れた感じがする、または気力がない",
    type: "select",
    options: ["全くない", "数日", "半分以上", "ほぼ毎日"],
    category: "depression"
  },
  {
    id: "d5",
    text: "食欲がない、または食べ過ぎる",
    type: "select",
    options: ["全くない", "数日", "半分以上", "ほぼ毎日"],
    category: "depression"
  },
  {
    id: "d6",
    text: "自分自身に対して否定的に考える — 自分が失敗者だと思ったり、自分や家族に申し訳ないと感じたりする",
    type: "select",
    options: ["全くない", "数日", "半分以上", "ほぼ毎日"],
    category: "depression"
  },
  {
    id: "d7",
    text: "新聞を読んだりテレビを見たりするときに、集中することが難しい",
    type: "select",
    options: ["全くない", "数日", "半分以上", "ほぼ毎日"],
    category: "depression"
  },
  {
    id: "d8",
    text: "動きや話し方が他の人が気づくほど遅くなったり、逆に落ち着きがなく、いつもよりソワソワと動き回ったりする",
    type: "select",
    options: ["全くない", "数日", "半分以上", "ほぼ毎日"],
    category: "depression"
  },
  {
    id: "d9",
    text: "自分が死んだ方がましだ、または自分を何らかの方法で傷つけようと考えたことがある",
    type: "select",
    options: ["全くない", "数日", "半分以上", "ほぼ毎日"],
    category: "depression"
  }
];

// GAD-7 不安障害スクリーニング
export const anxietyQuestions: AssessmentQuestion[] = [
  {
    id: "a1",
    text: "神経質になったり、不安になったり、または緊張したりすることがある",
    type: "select",
    options: ["全くない", "数日", "半分以上", "ほぼ毎日"],
    category: "anxiety"
  },
  {
    id: "a2",
    text: "心配することをやめられない、またはコントロールできない",
    type: "select",
    options: ["全くない", "数日", "半分以上", "ほぼ毎日"],
    category: "anxiety"
  },
  {
    id: "a3",
    text: "様々なことについて過度に心配する",
    type: "select",
    options: ["全くない", "数日", "半分以上", "ほぼ毎日"],
    category: "anxiety"
  },
  {
    id: "a4",
    text: "リラックスすることが難しい",
    type: "select",
    options: ["全くない", "数日", "半分以上", "ほぼ毎日"],
    category: "anxiety"
  },
  {
    id: "a5",
    text: "じっとしていられないほど落ち着かない",
    type: "select",
    options: ["全くない", "数日", "半分以上", "ほぼ毎日"],
    category: "anxiety"
  },
  {
    id: "a6",
    text: "簡単にイライラしたり、怒りっぽくなったりする",
    type: "select",
    options: ["全くない", "数日", "半分以上", "ほぼ毎日"],
    category: "anxiety"
  },
  {
    id: "a7",
    text: "何か恐ろしいことが起こるのではないかと恐れを感じる",
    type: "select",
    options: ["全くない", "数日", "半分以上", "ほぼ毎日"],
    category: "anxiety"
  }
];

// ストレスチェック
export const stressQuestions: AssessmentQuestion[] = [
  {
    id: "s1",
    text: "予期せぬことが起きて動揺することがありましたか？",
    type: "select",
    options: ["全くない", "ほとんどない", "時々ある", "かなりある", "非常に頻繁"],
    category: "stress"
  },
  {
    id: "s2",
    text: "人生の重要なことをコントロールできないと感じましたか？",
    type: "select",
    options: ["全くない", "ほとんどない", "時々ある", "かなりある", "非常に頻繁"],
    category: "stress"
  },
  {
    id: "s3",
    text: "神経質になったりストレスを感じましたか？",
    type: "select",
    options: ["全くない", "ほとんどない", "時々ある", "かなりある", "非常に頻繁"],
    category: "stress"
  },
  {
    id: "s4",
    text: "個人的な問題を効果的に処理する自信がありましたか？",
    type: "select",
    options: ["全くない", "ほとんどない", "時々ある", "かなりある", "非常に頻繁"],
    category: "stress"
  },
  {
    id: "s5",
    text: "物事があなたの思い通りに進んでいると感じましたか？",
    type: "select",
    options: ["全くない", "ほとんどない", "時々ある", "かなりある", "非常に頻繁"],
    category: "stress"
  },
  {
    id: "s6",
    text: "やらなければならないことすべてを処理できないと感じましたか？",
    type: "select",
    options: ["全くない", "ほとんどない", "時々ある", "かなりある", "非常に頻繁"],
    category: "stress"
  },
  {
    id: "s7",
    text: "イライラを効果的にコントロールできましたか？",
    type: "select",
    options: ["全くない", "ほとんどない", "時々ある", "かなりある", "非常に頻繁"],
    category: "stress"
  },
  {
    id: "s8",
    text: "すべてをうまく乗り切っていると感じましたか？",
    type: "select",
    options: ["全くない", "ほとんどない", "時々ある", "かなりある", "非常に頻繁"],
    category: "stress"
  },
  {
    id: "s9",
    text: "コントロールできないことに怒りを感じましたか？",
    type: "select",
    options: ["全くない", "ほとんどない", "時々ある", "かなりある", "非常に頻繁"],
    category: "stress"
  },
  {
    id: "s10",
    text: "困難が多すぎて乗り越えられないと感じましたか？",
    type: "select",
    options: ["全くない", "ほとんどない", "時々ある", "かなりある", "非常に頻繁"],
    category: "stress"
  }
];

// バーンアウト（燃え尽き症候群）評価
export const burnoutQuestions: AssessmentQuestion[] = [
  {
    id: "b1",
    text: "仕事や日常の活動で感情的に疲れ果てていると感じる",
    type: "scale",
    minLabel: "全くない",
    maxLabel: "毎日",
    category: "burnout"
  },
  {
    id: "b2",
    text: "一日の終わりに使い果たされた感じがする",
    type: "scale",
    minLabel: "全くない",
    maxLabel: "毎日",
    category: "burnout"
  },
  {
    id: "b3",
    text: "朝起きたとき、また一日仕事をすると思うと疲れを感じる",
    type: "scale",
    minLabel: "全くない",
    maxLabel: "毎日",
    category: "burnout"
  },
  {
    id: "b4",
    text: "他の人々と一緒に働くことは実際に負担である",
    type: "scale",
    minLabel: "全くない",
    maxLabel: "毎日",
    category: "burnout"
  },
  {
    id: "b5",
    text: "私の仕事/日常の活動で燃え尽きていると感じる",
    type: "scale",
    minLabel: "全くない",
    maxLabel: "毎日",
    category: "burnout"
  },
  {
    id: "b6",
    text: "仕事/日常の活動で欲求不満を感じる",
    type: "scale",
    minLabel: "全くない",
    maxLabel: "毎日",
    category: "burnout"
  },
  {
    id: "b7",
    text: "仕事/日常の活動に熱心に取り組んでいると感じる",
    type: "scale",
    minLabel: "全くない",
    maxLabel: "毎日",
    category: "burnout"
  },
  {
    id: "b8",
    text: "達成感を感じる",
    type: "scale",
    minLabel: "全くない",
    maxLabel: "毎日",
    category: "burnout"
  },
  {
    id: "b9",
    text: "以前は楽しんでいた活動への関心を失った",
    type: "scale",
    minLabel: "全くない",
    maxLabel: "毎日",
    category: "burnout"
  },
  {
    id: "b10",
    text: "人間関係や個人的なつながりから孤立していると感じる",
    type: "scale",
    minLabel: "全くない",
    maxLabel: "毎日",
    category: "burnout"
  }
];

export async function analyzeMentalHealthAssessment(
  answers: Record<string, number | string>,
  assessmentType: string = "general"
): Promise<AssessmentResult> {
  try {
    const model = getGeminiModel();
    
    // 評価タイプに基づいて質問を選択
    let questions;
    let title;
    let scoring;
    
    switch (assessmentType) {
      case "depression":
        questions = depressionQuestions;
        title = "うつ病スクリーニング (PHQ-9)";
        scoring = "PHQ-9スコア（0-27点、高いほど症状が重い）";
        break;
      case "anxiety":
        questions = anxietyQuestions;
        title = "不安障害スクリーニング (GAD-7)";
        scoring = "GAD-7スコア（0-21点、高いほど症状が重い）";
        break;
      case "stress":
        questions = stressQuestions;
        title = "ストレスチェック";
        scoring = "ストレススコア（0-40点、高いほどストレスが高い）";
        break;
      case "burnout":
        questions = burnoutQuestions;
        title = "バーンアウト評価";
        scoring = "バーンアウトスコア（0-100点、高いほど燃え尽き状態が深刻）";
        break;
      default:
        questions = mentalHealthQuestions;
        title = "一般的なメンタルヘルス評価";
        scoring = "総合スコア（0-100点、高いほど良好な状態）";
    }
    
    const promptData = {
      title,
      assessmentType,
      questions,
      answers
    };

    const systemPrompt = `あなたはメンタルヘルスの専門家です。ユーザーの回答に基づいて、${title}を行い、${scoring}、総合的な分析、および改善のための3つの推奨事項を提供してください。`;
    const userPrompt = `以下はユーザーの${title}への回答です。この回答を分析し、${scoring}、全体的な状態の要約、および改善のための具体的な推奨事項を3つ提供してください。必ずJSON形式で回答してください。必要なフィールドは score (数値), summary (文字列), recommendations (文字列の配列) です。回答データ: ${JSON.stringify(promptData)}`;
    
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
    const systemPrompt = "あなたはメンタルAIというメンタルヘルスアプリのコーチです。共感的で支持的な姿勢でユーザーをサポートします。メンタルヘルスのアドバイスを提供する際は、科学的な根拠に基づいた情報を心がけ、ユーザーの感情に寄り添いながらも、前向きな考え方や具体的な対処法を提案してください。医学的診断や治療は提供せず、深刻な問題の場合は専門家への相談を勧めます。";
    
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

/**
 * シンプルなチャットボット用の関数 - Google AIを使用
 * 
 * @param message ユーザーからのメッセージ
 * @param history 過去の会話履歴（オプション）
 * @returns AIの応答
 */
export async function getSimpleChatbotResponse(
  message: string,
  history: { isUser: boolean; content: string }[] = []
): Promise<string> {
  try {
    // APIキーの確認
    if (!process.env.GOOGLE_API_KEY) {
      console.error("GOOGLE_API_KEYが設定されていません");
      return "API設定エラーが発生しました。システム管理者にお問い合わせください。";
    }

    // 最も基本的なバージョンのモデルを使用
    const model = genAI.getGenerativeModel({
      model: "gemini-1.0-pro", // 無料で使用可能なモデル
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // システムプロンプト設定
    const systemPrompt = `あなたは「メンタルAI」という日本のAIカウンセラーサービスのチャットボットです。
ユーザーのメンタルヘルスに関する基本的な質問に日本語で答えてください。
専門的なカウンセリングや治療的なアドバイスは提供せず、深刻な症状がある場合は専門家に相談するよう促してください。
返答は簡潔で、共感的かつ前向きな表現を心がけてください。
日常的な会話や気軽な質問にも対応し、ユーザーの気分を明るくするような会話を心がけてください。
返答は最大300文字程度に抑えてください。`;

    // 会話履歴をフォーマット（最大5件まで）
    const recentHistory = history.slice(-5);
    let formattedMessages = "";
    
    recentHistory.forEach(msg => {
      const role = msg.isUser ? "ユーザー" : "AI";
      formattedMessages += `${role}: ${msg.content}\n`;
    });
    
    // プロンプトの構築
    const prompt = `${systemPrompt}\n\n会話履歴:\n${formattedMessages}\nユーザー: ${message}\nAI:`;
    
    console.log("チャットボットにリクエスト送信中...");
    
    // 応答の生成
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    });
    
    const response = result.response;
    return response.text() || "応答を生成できませんでした。";
  } catch (error) {
    console.error("チャットボットエラー:", error);
    return "申し訳ありませんが、応答の生成中にエラーが発生しました。しばらくしてからもう一度お試しください。";
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

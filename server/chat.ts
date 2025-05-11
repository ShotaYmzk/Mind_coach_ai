import { storage } from "./storage";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "dummy-key");

// セッションコンテキストのタイプ定義
type ChatSession = {
  id: number;
  userId: number;
  messages: { role: string; content: string }[];
};

// メモリ内のセッションキャッシュ
// 実運用ではRedisなどを使用することを推奨
const sessionCache = new Map<number, ChatSession>();

// セッションのTTL (1時間)
const SESSION_TTL = 60 * 60 * 1000;
const sessionExpiry = new Map<number, NodeJS.Timeout>();

/**
 * セッションの取得またはキャッシュからの読み込み
 */
export async function getOrCreateSession(sessionId: number, userId: number) {
  // キャッシュにあればキャッシュから取得
  if (sessionCache.has(sessionId)) {
    return sessionCache.get(sessionId)!;
  }

  // DBからセッション情報を取得
  const session = await storage.getChatSessionById(sessionId);
  if (!session) {
    throw new Error(`セッションが見つかりません: ${sessionId}`);
  }

  if (session.userId !== userId) {
    throw new Error("このセッションにアクセスする権限がありません");
  }

  // メッセージ履歴を取得
  const messages = await storage.getChatMessagesBySessionId(sessionId);
  
  // キャッシュに保存
  const sessionContext: ChatSession = {
    id: session.id,
    userId: session.userId,
    messages: messages.map(msg => ({
      role: msg.isUser ? "user" : "assistant",
      content: msg.content
    }))
  };

  sessionCache.set(sessionId, sessionContext);
  
  // TTLの設定
  if (sessionExpiry.has(sessionId)) {
    clearTimeout(sessionExpiry.get(sessionId)!);
  }
  
  sessionExpiry.set(
    sessionId,
    setTimeout(() => {
      sessionCache.delete(sessionId);
      sessionExpiry.delete(sessionId);
    }, SESSION_TTL)
  );

  return sessionContext;
}

/**
 * システムプロンプトの取得
 */
function getSystemPrompt() {
  return `あなたはメンタルヘルスのAIコーチです。ユーザーの心理的な健康をサポートし、ストレス、不安、気分の落ち込みなどに対処するためのガイダンスを提供します。

以下の原則に従ってください：
1. 共感的に対応し、ユーザーの感情を認識して受け止める
2. オープンな質問を通じてユーザーが自己理解を深められるよう促す
3. 具体的で実行可能なアドバイスを提供する
4. 科学的根拠に基づいた情報を提供する
5. ユーザーの自律性と選択を尊重する
6. 深刻な状態には必ず専門家への相談を勧める

重要：あなたは医療アドバイスを提供できません。診断や投薬に関する具体的なアドバイスを求められた場合は、必ず医療専門家に相談するよう促してください。

言葉遣い：
- 丁寧かつ親しみやすい表現を使ってください
- 敬語を基本としながらも、親しみやすさも大切にしてください
- 簡潔で明瞭な表現を心がけてください
- 専門用語は必要に応じて説明を加えてください

セッションの方向性：
1. ユーザーの現在の状態や課題を理解する
2. 具体的な目標や望む結果を明確にする
3. 実行可能な小さなステップを提案する
4. 進捗を確認し、前向きなフィードバックを提供する`;
}

/**
 * チャットの送信と応答の生成
 */
export async function sendChatMessage(sessionId: number, userId: number, message: string) {
  // セッションの取得
  const session = await getOrCreateSession(sessionId, userId);
  
  // ユーザーメッセージをDBに保存
  const userMessage = await storage.createChatMessage({
    sessionId: sessionId,
    content: message,
    isUser: true
  });
  
  // セッションにメッセージを追加
  session.messages.push({
    role: "user",
    content: message
  });

  // AIへのプロンプト構築
  const systemPrompt = getSystemPrompt();
  const messages = [
    { role: "system", content: systemPrompt },
    ...session.messages 
  ];

  try {
    // AIモデルの初期化
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
    });
    
    // Gemini APIでのチャットは簡略化して実装
    // 履歴を使わず直接プロンプトとしてメッセージを送信
    
    // レスポンス取得
    const promptText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const result = await model.generateContent(promptText);
    const responseText = result.response.text();
    
    // AIの応答をDBに保存
    const aiMessage = await storage.createChatMessage({
      sessionId: sessionId,
      content: responseText,
      isUser: false
    });
    
    // セッションキャッシュを更新
    session.messages.push({
      role: "assistant",
      content: responseText
    });
    
    return responseText;
  } catch (error) {
    console.error("AIチャットエラー:", error);
    throw error;
  }
}

/**
 * チャット履歴の取得
 */
export async function getChatHistory(sessionId: number, userId: number) {
  try {
    // セッションの検証
    const session = await storage.getChatSessionById(sessionId);
    if (!session) {
      throw new Error(`セッションが見つかりません: ${sessionId}`);
    }

    if (session.userId !== userId) {
      throw new Error("このセッションにアクセスする権限がありません");
    }

    // メッセージ履歴を取得
    const messages = await storage.getChatMessagesBySessionId(sessionId);
    return messages;
  } catch (error) {
    console.error("チャット履歴取得エラー:", error);
    throw error;
  }
}

/**
 * 新しいチャットセッションの作成
 */
export async function createChatSession(userId: number, title?: string) {
  try {
    // セッション作成
    const session = await storage.createChatSession({
      userId,
      title: title || "新しいセッション"
    });
    
    return session;
  } catch (error) {
    console.error("チャットセッション作成エラー:", error);
    throw error;
  }
}

/**
 * ユーザーのチャットセッション一覧取得
 */
export async function getUserChatSessions(userId: number) {
  try {
    const sessions = await storage.getChatSessionsByUserId(userId);
    return sessions;
  } catch (error) {
    console.error("チャットセッション一覧取得エラー:", error);
    throw error;
  }
}
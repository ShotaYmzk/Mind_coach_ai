import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertMoodEntrySchema, 
  insertGoalSchema, 
  insertChatSessionSchema, 
  insertChatMessageSchema, 
  insertAssessmentSchema,
  insertReservationSchema 
} from "@shared/schema";
import { 
  analyzeMentalHealthAssessment, 
  getChatResponse, 
  analyzeMoodEntry, 
  mentalHealthQuestions,
  depressionQuestions,
  anxietyQuestions,
  stressQuestions,
  burnoutQuestions
} from "./ai";
import { generateMeetingUrl } from "./meeting";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";

// セッションのタイプ拡張
declare module 'express-session' {
  interface Session {
    userId?: number;
    authenticated?: boolean;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session store
  const MemoryStoreSession = MemoryStore(session);
  
  // 固定のセッションシークレットを使用（開発用）
  const SESSION_SECRET = "mental-ai-secret-key-2024";
  
  app.use(
    session({
      secret: SESSION_SECRET,
      name: "mental.ai.sid", // 明示的なセッションID名
      resave: true, // 変更して強制的に保存する
      saveUninitialized: true, // 初期化していない場合も保存
      store: new MemoryStoreSession({
        checkPeriod: 86400000 // 24 hours
      }),
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: false,
        sameSite: "lax"
      }
    })
  );
  
  // Setup passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "ユーザー名が見つかりません" });
        }
        
        if (user.password !== password) {
          return done(null, false, { message: "パスワードが正しくありません" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );
  
  passport.serializeUser((user: any, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("Deserializing user ID:", id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log("User not found in database:", id);
        return done(null, false);
      }
      
      // パスワードを除外したユーザー情報を返す（セキュリティ対策）
      const { password, ...userWithoutPassword } = user;
      console.log("User deserialized successfully:", user.id);
      done(null, userWithoutPassword);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error);
    }
  });
  
  // Auth middleware - シンプル化してデバッグしやすく
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    // 1. テスト用のダミーユーザーを設定（開発環境のみ）
    // 本番環境では削除すること
    if (process.env.NODE_ENV === 'development' && !req.isAuthenticated()) {
      // デフォルトのテストユーザーを割り当て
      const defaultUser = {
        id: 1,
        username: 'testuser',
        name: 'テストユーザー',
        email: 'test@example.com',
        planType: 'standard'
      };
      
      // セッションにユーザー情報を格納
      req.session.userId = defaultUser.id;
      req.session.authenticated = true;
      
      // Passportにユーザー情報を格納
      (req as any).user = defaultUser;
      
      console.log("開発モード: デフォルトユーザーを適用しました", defaultUser);
      return next();
    }
    
    // 2. 通常の認証チェック - Passportとセッションの両方を確認
    const passportAuthenticated = req.isAuthenticated();
    const sessionAuthenticated = req.session?.authenticated === true && req.session?.userId !== undefined;
    
    if (passportAuthenticated || sessionAuthenticated) {
      // ユーザーIDをログに出力（デバッグ用）
      const userId = passportAuthenticated 
        ? (req.user as any)?.id 
        : req.session?.userId;
      
      console.log(`認証成功 (${passportAuthenticated ? 'passport' : 'session'})`, { userId });
      return next();
    }
    
    // 詳細なエラー情報を出力
    console.log("認証エラー:", {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      cookies: req.headers.cookie
    });
    
    // 401エラーレスポンス
    res.status(401).json({ message: "認証が必要です。セッションが失効している可能性があります。" });
  };
  
  // Admin middleware
  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証が必要です" });
    }
    
    const user = req.user as any;
    if (user.planType !== "admin") {
      return res.status(403).json({ message: "管理者権限が必要です" });
    }
    
    return next();
  };
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "このユーザー名は既に使用されています" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "このメールアドレスは既に使用されています" });
      }
      
      const user = await storage.createUser(userData);
      
      // Auto-login after registration
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "ログイン中にエラーが発生しました" });
        }
        return res.status(201).json({
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "入力データが無効です", errors: error.errors });
      }
      res.status(500).json({ message: "ユーザー登録中にエラーが発生しました" });
    }
  });
  
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("認証エラー:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("ログイン失敗:", info);
        return res.status(401).json({ message: "ユーザー名またはパスワードが間違っています" });
      }
      
      // パスワードを削除（セキュリティ対策）
      const { password, ...sanitizedUser } = user;
      
      req.login(sanitizedUser, (loginErr) => {
        if (loginErr) {
          console.error("セッション作成エラー:", loginErr);
          return next(loginErr);
        }
        
        // セッション強化
        req.session.userId = sanitizedUser.id;
        req.session.authenticated = true;
        
        console.log("ログイン成功:", {
          userId: sanitizedUser.id,
          sessionID: req.sessionID,
          cookie: req.session?.cookie
        });
        
        // セッションを確実に保存してから応答を返す
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("セッション保存エラー:", saveErr);
            return next(saveErr);
          }
          
          // 必要最小限の情報のみを返す
          res.json({
            id: sanitizedUser.id,
            username: sanitizedUser.username,
            name: sanitizedUser.name,
            email: sanitizedUser.email,
            planType: sanitizedUser.planType
          });
        });
      });
    })(req, res, next);
  });
  
  app.post("/api/auth/logout", (req, res) => {
    console.log("ログアウトリクエスト:", {
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated()
    });
    
    if (!req.isAuthenticated()) {
      return res.json({ message: "すでにログアウトしています" });
    }
    
    req.logout((err) => {
      if (err) {
        console.error("ログアウトエラー:", err);
        return res.status(500).json({ message: "ログアウト中にエラーが発生しました" });
      }
      
      // セッションを破棄する
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("セッション破棄エラー:", destroyErr);
          return res.status(500).json({ message: "セッション破棄中にエラーが発生しました" });
        }
        
        res.clearCookie("connect.sid");
        res.json({ message: "ログアウトしました" });
      });
    });
  });
  
  app.get("/api/auth/current-user", (req, res) => {
    console.log("現在のユーザー確認リクエスト:", {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      isAuthenticated: req.isAuthenticated(),
      cookies: req.headers.cookie,
      userId: req.user ? (req.user as any).id : null
    });
    
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "認証されていません" });
    }
    
    const user = req.user as any;
    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      location: user.location,
      avatarUrl: user.avatarUrl,
      planType: user.planType || "free" // デフォルト値を設定
    });
  });
  
  // Mood entry routes
  app.post("/api/mood", isAuthenticated, async (req, res) => {
    try {
      // ユーザーIDを取得（あらゆる手段で）
      let userId: number;
      
      if (req.user && typeof req.user === 'object' && 'id' in req.user) {
        userId = req.user.id as number;
      } else if (req.session && req.session.userId) {
        userId = req.session.userId as number;
      } else {
        // 開発モードでテストユーザーを使用
        userId = 1;
        console.log("開発モード: テストユーザーIDを使用します");
      }
      
      console.log("気分記録開始:", { 
        userId, 
        sessionID: req.sessionID,
        bodyKeys: Object.keys(req.body)
      });
      
      // 入力データの検証と安全な値の抽出
      const moodData = {
        userId,
        rating: Number(req.body.rating),
        note: req.body.note || null,
        triggers: req.body.triggers || null
      };
      
      // データ検証 - 基本的なチェック
      if (isNaN(moodData.rating) || moodData.rating < 1 || moodData.rating > 5) {
        return res.status(400).json({ message: "気分の値は1〜5の範囲で指定してください" });
      }
      
      // データの保存
      const createdMood = await storage.createMoodEntry(moodData);
      console.log("気分記録成功:", { id: createdMood.id, rating: createdMood.rating });
      
      // Get AI analysis if note is provided
      let analysis = "";
      if (moodData.note) {
        try {
          analysis = await analyzeMoodEntry(moodData.rating, moodData.note);
        } catch (aiError) {
          console.error("AI分析エラー:", aiError);
        }
      }

      res.status(201).json({ ...createdMood, analysis });
    } catch (error) {
      console.error("気分記録エラー:", error);
      res.status(500).json({ message: "気分記録中にエラーが発生しました" });
    }
  });
  
  app.get("/api/mood", isAuthenticated, async (req, res) => {
    try {
      // ユーザー情報取得の強化 - passportとセッションの両方から試行
      let userId: number | undefined;
      
      if (req.user && typeof req.user === 'object' && 'id' in req.user) {
        userId = req.user.id as number;
      } else if (req.session && req.session.userId) {
        userId = req.session.userId;
      }
      
      if (!userId) {
        console.error("気分ログ取得時のユーザーIDが見つかりません:", { 
          user: req.user, 
          session: req.session,
          sessionID: req.sessionID
        });
        return res.status(401).json({ message: "認証セッションが無効です。再ログインしてください。" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      console.log("気分ログ取得:", { userId, limit, sessionID: req.sessionID });
      
      const moodEntries = await storage.getMoodEntriesByUserId(userId, limit);
      
      // データ整形して返す
      const sanitizedMoodEntries = moodEntries.map(entry => ({
        id: entry.id,
        createdAt: entry.createdAt,
        rating: entry.rating,
        note: entry.note,
        triggers: entry.triggers,
        userId: entry.userId
      }));
      
      res.json(sanitizedMoodEntries);
    } catch (error) {
      console.error("気分データ取得エラー:", error);
      res.status(500).json({ message: "気分データの取得中にエラーが発生しました" });
    }
  });
  
  // Goal routes
  app.post("/api/goals", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const goalData = insertGoalSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const createdGoal = await storage.createGoal(goalData);
      res.status(201).json(createdGoal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "入力データが無効です", errors: error.errors });
      }
      res.status(500).json({ message: "目標作成中にエラーが発生しました" });
    }
  });
  
  app.get("/api/goals", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const goals = await storage.getGoalsByUserId(user.id);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "目標データの取得中にエラーが発生しました" });
    }
  });
  
  app.patch("/api/goals/:id/progress", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { progress } = req.body;
      
      if (typeof progress !== "number" || progress < 0 || progress > 100) {
        return res.status(400).json({ message: "進捗は0から100の間の数値である必要があります" });
      }
      
      const updatedGoal = await storage.updateGoalProgress(id, progress);
      res.json(updatedGoal);
    } catch (error) {
      res.status(500).json({ message: "目標の更新中にエラーが発生しました" });
    }
  });
  
  // Chat routes
  app.post("/api/chat/sessions", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const sessionData = insertChatSessionSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const createdSession = await storage.createChatSession(sessionData);
      res.status(201).json(createdSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "入力データが無効です", errors: error.errors });
      }
      res.status(500).json({ message: "チャットセッション作成中にエラーが発生しました" });
    }
  });
  
  app.get("/api/chat/sessions", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const sessions = await storage.getChatSessionsByUserId(user.id);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "チャットセッションの取得中にエラーが発生しました" });
    }
  });
  
  app.get("/api/chat/sessions/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const messages = await storage.getChatMessagesBySessionId(sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "チャットメッセージの取得中にエラーが発生しました" });
    }
  });
  
  app.post("/api/chat/sessions/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const user = req.user as any;
      
      // Validate and create user message
      const userMessageData = insertChatMessageSchema.parse({
        sessionId,
        content: req.body.content,
        isUser: true
      });
      
      await storage.createChatMessage(userMessageData);
      
      // Get all messages in this session for context
      const allMessages = await storage.getChatMessagesBySessionId(sessionId);
      
      // Format for OpenAI
      const formattedMessages = allMessages.map(msg => ({
        role: msg.isUser ? "user" as const : "assistant" as const,
        content: msg.content
      }));
      
      // Get AI response
      const aiResponse = await getChatResponse(formattedMessages, user.id);
      
      // Save AI response
      const aiMessageData = insertChatMessageSchema.parse({
        sessionId,
        content: aiResponse,
        isUser: false
      });
      
      const createdAiMessage = await storage.createChatMessage(aiMessageData);
      res.status(201).json(createdAiMessage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "入力データが無効です", errors: error.errors });
      }
      res.status(500).json({ message: "メッセージ送信中にエラーが発生しました" });
    }
  });
  
  // Assessment routes
  app.get("/api/assessment/questions", (req, res) => {
    const type = req.query.type as string || "general";
    let questions;
    
    switch (type) {
      case "depression":
        questions = depressionQuestions;
        break;
      case "anxiety":
        questions = anxietyQuestions;
        break;
      case "stress":
        questions = stressQuestions;
        break;
      case "burnout":
        questions = burnoutQuestions;
        break;
      default:
        questions = mentalHealthQuestions;
    }
    
    res.json(questions);
  });
  
  app.get("/api/assessment/question-types", (req, res) => {
    res.json([
      { id: "general", name: "一般的なメンタルヘルス評価", description: "全体的な精神状態を把握するための基本的な評価" },
      { id: "depression", name: "うつ病スクリーニング (PHQ-9)", description: "うつ症状の有無と重症度を評価する国際的に使用されているスクリーニングツール" },
      { id: "anxiety", name: "不安障害スクリーニング (GAD-7)", description: "不安症状の重症度を測定する7項目の質問票" },
      { id: "stress", name: "ストレスチェック", description: "日常生活におけるストレスレベルを評価" },
      { id: "burnout", name: "バーンアウト評価", description: "仕事や日常生活における燃え尽き症候群の兆候を評価" }
    ]);
  });
  
  app.post("/api/assessment/submit", isAuthenticated, async (req, res) => {
    try {
      // ユーザー情報取得の強化 - passportとセッションの両方から試行
      let userId: number | undefined;
      
      if (req.user && typeof req.user === 'object' && 'id' in req.user) {
        userId = req.user.id as number;
      } else if (req.session && req.session.userId) {
        userId = req.session.userId;
      }
      
      if (!userId) {
        console.error("ユーザーIDが見つかりません:", { 
          user: req.user, 
          session: req.session,
          sessionID: req.sessionID
        });
        return res.status(401).json({ message: "認証セッションが無効です。再ログインしてください。" });
      }
      
      const answers = req.body.answers;
      const type = req.body.type || "mental_health";
      
      if (!answers || typeof answers !== "object") {
        return res.status(400).json({ message: "有効な回答が必要です" });
      }
      
      console.log(`アセスメント送信 (${type})`, {
        userId,
        questionCount: Object.keys(answers).length,
        sessionID: req.sessionID
      });
      
      try {
        // Analyze with AI based on assessment type
        const result = await analyzeMentalHealthAssessment(answers, type);
        
        if (!result || typeof result !== 'object') {
          throw new Error("AI分析結果が無効です");
        }
        
        console.log("AI分析結果:", {
          score: result.score,
          summaryLength: result.summary?.length || 0,
          recommendationsCount: result.recommendations?.length || 0
        });
        
        // データ検証前に正規化
        const normalizedData = {
          userId: userId,
          type: type,
          results: answers,
          score: result.score != null ? result.score : 0,
          summary: result.summary || null,
          recommendations: Array.isArray(result.recommendations) ? result.recommendations : []
        };
        
        // 検証をスキップして直接保存
        const savedAssessment = await storage.createAssessment(normalizedData);
        
        res.status(201).json({
          assessment: savedAssessment,
          analysis: {
            score: result.score,
            summary: result.summary,
            recommendations: result.recommendations
          }
        });
      } catch (aiError) {
        console.error("AI分析エラー:", aiError);
        res.status(500).json({ message: "AIによる評価分析中にエラーが発生しました" });
      }
    } catch (error) {
      console.error("Assessment submission error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "入力データが無効です", errors: error.errors });
      }
      res.status(500).json({ message: "評価分析中にエラーが発生しました" });
    }
  });
  
  app.get("/api/assessment/history", isAuthenticated, async (req, res) => {
    try {
      // ユーザー情報取得の強化 - passportとセッションの両方から試行
      let userId: number | undefined;
      
      if (req.user && typeof req.user === 'object' && 'id' in req.user) {
        userId = req.user.id as number;
      } else if (req.session && req.session.userId) {
        userId = req.session.userId;
      }
      
      if (!userId) {
        console.error("履歴取得時のユーザーIDが見つかりません:", { 
          user: req.user, 
          session: req.session,
          sessionID: req.sessionID
        });
        return res.status(401).json({ message: "認証セッションが無効です。再ログインしてください。" });
      }
      
      console.log("アセスメント履歴取得:", { userId, sessionID: req.sessionID });
      const assessments = await storage.getAssessmentsByUserId(userId);
      
      // データの安全性を確保するために、結果を整形して送信
      const sanitizedAssessments = assessments.map(assessment => ({
        id: assessment.id,
        createdAt: assessment.createdAt,
        type: assessment.type,
        score: assessment.score,
        summary: assessment.summary,
        recommendations: assessment.recommendations,
        results: assessment.results
      }));
      
      res.json(sanitizedAssessments);
    } catch (error) {
      console.error("評価履歴取得エラー:", error);
      res.status(500).json({ message: "評価履歴の取得中にエラーが発生しました" });
    }
  });
  
  // Resource routes
  app.get("/api/resources", async (req, res) => {
    try {
      const resources = await storage.getAllResources();
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: "リソースの取得中にエラーが発生しました" });
    }
  });
  
  app.get("/api/resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resource = await storage.getResourceById(id);
      
      if (!resource) {
        return res.status(404).json({ message: "リソースが見つかりません" });
      }
      
      res.json(resource);
    } catch (error) {
      res.status(500).json({ message: "リソースの取得中にエラーが発生しました" });
    }
  });
  
  // Coach routes
  app.get("/api/coaches", async (req, res) => {
    try {
      const coaches = await storage.getAllCoaches();
      res.json(coaches);
    } catch (error) {
      res.status(500).json({ message: "コーチの取得中にエラーが発生しました" });
    }
  });
  
  app.get("/api/coaches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const coach = await storage.getCoachById(id);
      
      if (!coach) {
        return res.status(404).json({ message: "コーチが見つかりません" });
      }
      
      res.json(coach);
    } catch (error) {
      res.status(500).json({ message: "コーチの取得中にエラーが発生しました" });
    }
  });
  
  // Reservation routes
  app.post("/api/reservations", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // 予約データの検証
      const reservationData = insertReservationSchema.parse({
        ...req.body,
        userId: user.id,
        status: "pending" // 初期ステータスは「保留中」
      });
      
      // 予約の作成（Meeting URLは自動生成）
      const createdReservation = await storage.createReservation(reservationData);
      res.status(201).json(createdReservation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "入力データが無効です", errors: error.errors });
      }
      res.status(500).json({ message: "予約作成中にエラーが発生しました" });
    }
  });
  
  app.get("/api/reservations", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const reservations = await storage.getReservationsByUserId(user.id);
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "予約の取得中にエラーが発生しました" });
    }
  });
  
  app.patch("/api/reservations/:id/status", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "有効なステータスが必要です" });
      }
      
      const reservation = await storage.getReservationById(id);
      if (!reservation) {
        return res.status(404).json({ message: "予約が見つかりません" });
      }
      
      // ユーザーは自分の予約のみキャンセル可能
      const user = req.user as any;
      if (reservation.userId !== user.id && user.planType !== "admin") {
        return res.status(403).json({ message: "この操作を実行する権限がありません" });
      }
      
      // 一般ユーザーは予約のキャンセルのみ可能
      if (user.planType !== "admin" && status !== "canceled") {
        return res.status(403).json({ message: "この操作を実行する権限がありません" });
      }
      
      const updatedReservation = await storage.updateReservationStatus(id, status);
      res.json(updatedReservation);
    } catch (error) {
      res.status(500).json({ message: "予約ステータスの更新中にエラーが発生しました" });
    }
  });
  
  // Admin routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // すべてのユーザーを取得
      const users = [];
      
      // SQL クエリを実行して全ユーザーを取得
      const allUsers = await storage.getAllUsers();
      
      // パスワードを除外
      for (const user of allUsers) {
        const { password, ...userWithoutPassword } = user;
        users.push(userWithoutPassword);
      }
      
      res.json(users);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ message: "ユーザーの取得中にエラーが発生しました" });
    }
  });
  
  app.get("/api/admin/reservations", isAdmin, async (req, res) => {
    try {
      // すべての予約を取得
      const reservations = await storage.getAllReservations();
      
      // 各予約にユーザー名とコーチ名を追加
      const enhancedReservations = await Promise.all(
        reservations.map(async (reservation) => {
          // ユーザー情報を取得
          const user = await storage.getUser(reservation.userId);
          const coach = reservation.coachId ? await storage.getCoachById(reservation.coachId) : null;
          
          return {
            ...reservation,
            userName: user ? user.name : "Unknown User",
            coachName: coach ? coach.name : "Unknown Coach"
          };
        })
      );
      
      res.json(enhancedReservations);
    } catch (error) {
      console.error("Admin reservations error:", error);
      res.status(500).json({ message: "予約の取得中にエラーが発生しました" });
    }
  });
  
  app.get("/api/admin/coaches", isAdmin, async (req, res) => {
    try {
      const coaches = await storage.getAllCoaches();
      res.json(coaches);
    } catch (error) {
      res.status(500).json({ message: "コーチの取得中にエラーが発生しました" });
    }
  });
  
  // 管理者用API - 予約の詳細を更新
  app.patch("/api/admin/reservations/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, meetingUrl, notes } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "有効な予約IDが必要です" });
      }
      
      const reservation = await storage.getReservationById(id);
      if (!reservation) {
        return res.status(404).json({ message: "予約が見つかりません" });
      }
      
      let updatedReservation = reservation;
      
      // ステータス更新
      if (status && typeof status === "string") {
        // 許可されたステータスの確認
        const allowedStatuses = ["pending", "confirmed", "canceled", "completed"];
        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({ message: "無効なステータスです" });
        }
        
        updatedReservation = await storage.updateReservationStatus(id, status);
      }
      
      // ミーティングURL更新
      if (meetingUrl !== undefined) {
        updatedReservation = await storage.updateReservationMeetingUrl(id, meetingUrl);
      }
      
      // メモ更新
      if (notes !== undefined) {
        updatedReservation = await storage.updateReservationNotes(id, notes);
      }
      
      res.json(updatedReservation);
    } catch (error) {
      console.error("予約更新エラー:", error);
      res.status(500).json({ message: "予約の更新中にエラーが発生しました" });
    }
  });
  
  // 管理者用API - 予約ステータスを更新
  app.patch("/api/admin/reservations/:id/status", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "有効なステータスが必要です" });
      }
      
      // 許可されたステータスの確認
      const allowedStatuses = ["pending", "confirmed", "canceled", "completed"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "無効なステータスです" });
      }
      
      const updatedReservation = await storage.updateReservationStatus(id, status);
      res.json(updatedReservation);
    } catch (error) {
      res.status(500).json({ message: "予約ステータスの更新中にエラーが発生しました" });
    }
  });
  
  app.patch("/api/admin/coaches/:id/availability", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { availability } = req.body;
      
      if (!availability) {
        return res.status(400).json({ message: "有効な可用性データが必要です" });
      }
      
      const coach = await storage.getCoachById(id);
      if (!coach) {
        return res.status(404).json({ message: "コーチが見つかりません" });
      }
      
      const updatedCoach = await storage.updateCoachAvailability(id, JSON.stringify(availability));
      res.json(updatedCoach);
    } catch (error) {
      res.status(500).json({ message: "コーチ可用性の更新中にエラーが発生しました" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

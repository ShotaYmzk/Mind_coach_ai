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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session store
  const MemoryStoreSession = MemoryStore(session);
  
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "mindcoach-ai-secret",
      resave: true,
      saveUninitialized: true,
      store: new MemoryStoreSession({
        checkPeriod: 86400000 // 24 hours
      }),
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: false, // Replit環境では開発中でもHTTPSを使用することがあるため
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
      console.log("User deserialized successfully:", user.id);
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error);
    }
  });
  
  // Auth middleware with detailed debugging
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    console.log("認証エラー情報:", {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      cookie: req.session?.cookie,
      headers: req.headers,
      reqUser: req.user
    });
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
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("セッション作成エラー:", loginErr);
          return next(loginErr);
        }
        
        console.log("ログイン成功:", {
          userId: user.id,
          sessionID: req.sessionID,
          cookie: req.session?.cookie
        });
        
        // セッションを確実に保存してから応答を返す
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("セッション保存エラー:", saveErr);
            return next(saveErr);
          }
          
          res.json({
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            planType: user.planType
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
      const user = req.user as any;
      const moodData = insertMoodEntrySchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const createdMood = await storage.createMoodEntry(moodData);
      
      // Get AI analysis if note is provided
      let analysis = "";
      if (moodData.note) {
        analysis = await analyzeMoodEntry(moodData.rating, moodData.note);
      }
      
      res.status(201).json({ ...createdMood, analysis });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "入力データが無効です", errors: error.errors });
      }
      res.status(500).json({ message: "気分記録中にエラーが発生しました" });
    }
  });
  
  app.get("/api/mood", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const moodEntries = await storage.getMoodEntriesByUserId(user.id, limit);
      res.json(moodEntries);
    } catch (error) {
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
      const user = req.user as any;
      const answers = req.body.answers;
      const type = req.body.type || "general";
      
      if (!answers || typeof answers !== "object") {
        return res.status(400).json({ message: "有効な回答が必要です" });
      }
      
      // Analyze with AI based on assessment type
      const result = await analyzeMentalHealthAssessment(answers, type);
      
      // Save assessment
      const assessmentData = insertAssessmentSchema.parse({
        userId: user.id,
        type: type,
        results: answers,
        score: result.score,
        summary: result.summary,
        recommendations: result.recommendations
      });
      
      const savedAssessment = await storage.createAssessment(assessmentData);
      
      res.status(201).json({
        assessment: savedAssessment,
        analysis: {
          score: result.score,
          summary: result.summary,
          recommendations: result.recommendations
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "入力データが無効です", errors: error.errors });
      }
      res.status(500).json({ message: "評価分析中にエラーが発生しました" });
    }
  });
  
  app.get("/api/assessment/history", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const assessments = await storage.getAssessmentsByUserId(user.id);
      res.json(assessments);
    } catch (error) {
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

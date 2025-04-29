import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertMoodEntrySchema, insertGoalSchema, insertChatSessionSchema, insertChatMessageSchema, insertAssessmentSchema } from "@shared/schema";
import { analyzeMentalHealthAssessment, getChatResponse, analyzeMoodEntry, mentalHealthQuestions } from "./ai";
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
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000 // 24 hours
      }),
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
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
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "認証が必要です" });
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
  
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    const user = req.user as any;
    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email
    });
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "ログアウトしました" });
    });
  });
  
  app.get("/api/auth/current-user", (req, res) => {
    if (!req.user) {
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
      planType: user.planType
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
      
      // Get AI analysis if notes are provided
      let analysis = "";
      if (moodData.notes) {
        analysis = await analyzeMoodEntry(moodData.rating, moodData.notes);
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
    res.json(mentalHealthQuestions);
  });
  
  app.post("/api/assessment/submit", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const answers = req.body.answers;
      
      if (!answers || typeof answers !== "object") {
        return res.status(400).json({ message: "有効な回答が必要です" });
      }
      
      // Analyze with AI
      const result = await analyzeMentalHealthAssessment(answers);
      
      // Save assessment
      const assessmentData = insertAssessmentSchema.parse({
        userId: user.id,
        type: "mental_health",
        results: answers,
        score: result.score
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

  const httpServer = createServer(app);
  return httpServer;
}

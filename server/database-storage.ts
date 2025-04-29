// Import necessary dependencies
import { db } from "./db";
import { asc, desc, eq } from "drizzle-orm";
import {
  users, moodEntries, goals, chatSessions, chatMessages, assessments, resources,
  type User, type InsertUser,
  type MoodEntry, type InsertMoodEntry,
  type Goal, type InsertGoal,
  type ChatSession, type InsertChatSession,
  type ChatMessage, type InsertChatMessage,
  type Assessment, type InsertAssessment,
  type Resource, type InsertResource
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // MoodEntry methods
  async createMoodEntry(insertMoodEntry: InsertMoodEntry): Promise<MoodEntry> {
    const [moodEntry] = await db.insert(moodEntries).values(insertMoodEntry).returning();
    return moodEntry;
  }

  async getMoodEntriesByUserId(userId: number, limit?: number): Promise<MoodEntry[]> {
    let query = db.select().from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.createdAt));

    if (limit) {
      return await query.limit(limit);
    }

    return await query;
  }

  // Goal methods
  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const [goal] = await db.insert(goals).values(insertGoal).returning();
    return goal;
  }

  async getGoalsByUserId(userId: number): Promise<Goal[]> {
    return await db.select().from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.createdAt));
  }

  async updateGoalProgress(id: number, progress: number): Promise<Goal> {
    const completed = progress >= 100;
    const [updatedGoal] = await db.update(goals)
      .set({ progress, completed })
      .where(eq(goals.id, id))
      .returning();

    if (!updatedGoal) {
      throw new Error(`Goal with id ${id} not found`);
    }

    return updatedGoal;
  }

  // ChatSession methods
  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const [session] = await db.insert(chatSessions).values(insertSession).returning();
    return session;
  }

  async getChatSessionsByUserId(userId: number): Promise<ChatSession[]> {
    return await db.select().from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.createdAt));
  }

  async getChatSessionById(id: number): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session || undefined;
  }

  // ChatMessage methods
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    return message;
  }

  async getChatMessagesBySessionId(sessionId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt));
  }

  // Assessment methods
  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const [assessment] = await db.insert(assessments).values(insertAssessment).returning();
    return assessment;
  }

  async getAssessmentsByUserId(userId: number): Promise<Assessment[]> {
    return await db.select().from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.createdAt));
  }

  // Resource methods
  async createResource(insertResource: InsertResource): Promise<Resource> {
    const [resource] = await db.insert(resources).values(insertResource).returning();
    return resource;
  }

  async getAllResources(): Promise<Resource[]> {
    return await db.select().from(resources);
  }

  async getResourceById(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource || undefined;
  }

  // Seed initial data if needed
  async seedInitialData() {
    // Check if resources already exist
    const existingResources = await db.select().from(resources);
    if (existingResources.length === 0) {
      // Add sample resources
      const sampleResources: InsertResource[] = [
        {
          title: "ストレス管理のためのマインドフルネス実践ガイド",
          description: "日常生活にマインドフルネスを取り入れる方法と、ストレスを軽減するための簡単な瞑想テクニック",
          type: "article",
          estimatedTime: "15分",
          url: "https://example.com/mindfulness",
        },
        {
          title: "感情日記の書き方：感情を理解し、コントロールするためのガイド",
          description: "感情を記録し、パターンを認識することで、メンタルヘルスを改善するためのステップバイステップガイド",
          type: "pdf",
          estimatedTime: "10分",
          url: "https://example.com/emotion-journal",
        },
        {
          title: "睡眠の質を向上させる7つの科学的に証明された方法",
          description: "良質な睡眠を得るための実践的なアドバイスと、夜間のルーティンを改善するためのヒント",
          type: "video",
          estimatedTime: "12分",
          url: "https://example.com/better-sleep",
        },
        {
          title: "職場でのストレス管理：バーンアウトを防ぐためのテクニック",
          description: "仕事のプレッシャーに対処し、健全なワークライフバランスを維持するための実践的な戦略",
          type: "article",
          estimatedTime: "20分",
          url: "https://example.com/workplace-stress",
        },
        {
          title: "マインドフルネス瞑想の基本：初心者向けガイド",
          description: "マインドフルネス瞑想を始めるための簡単なステップと、日常生活への取り入れ方",
          type: "audio",
          estimatedTime: "25分",
          url: "https://example.com/meditation-guide",
        },
      ];

      await db.insert(resources).values(sampleResources);
    }
  }
}
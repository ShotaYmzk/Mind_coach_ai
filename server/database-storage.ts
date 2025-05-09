// Import necessary dependencies
import { db } from "./db";
import { asc, desc, eq } from "drizzle-orm";
import {
  users, moodEntries, goals, chatSessions, chatMessages, assessments, resources,
  reservations, coaches,
  type User, type InsertUser,
  type MoodEntry, type InsertMoodEntry,
  type Goal, type InsertGoal,
  type ChatSession, type InsertChatSession,
  type ChatMessage, type InsertChatMessage,
  type Assessment, type InsertAssessment,
  type Resource, type InsertResource,
  type Reservation, type InsertReservation,
  type Coach, type InsertCoach
} from "@shared/schema";
import { IStorage } from "./storage";
import { generateMeetingUrl } from "./meeting";

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

  // Reservation methods
  async createReservation(insertReservation: InsertReservation): Promise<Reservation> {
    // ダミーのMeeting URLを生成
    const date = new Date(insertReservation.date);
    const name = "user"; // 実際にはユーザー名を取得するロジックが必要
    const meetingUrl = generateMeetingUrl(date, name);
    
    // 既存の値を保持しつつ、meetingUrlを追加
    const reservationWithMeeting = {
      ...insertReservation,
      meetingUrl
    };
    
    const [reservation] = await db.insert(reservations).values(reservationWithMeeting).returning();
    return reservation;
  }

  async getReservationsByUserId(userId: number): Promise<Reservation[]> {
    return await db.select().from(reservations)
      .where(eq(reservations.userId, userId))
      .orderBy(asc(reservations.date));
  }

  async getReservationById(id: number): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation || undefined;
  }

  async updateReservationStatus(id: number, status: string): Promise<Reservation> {
    const [updatedReservation] = await db.update(reservations)
      .set({ status })
      .where(eq(reservations.id, id))
      .returning();

    if (!updatedReservation) {
      throw new Error(`Reservation with id ${id} not found`);
    }

    return updatedReservation;
  }

  // Coach methods
  async createCoach(insertCoach: InsertCoach): Promise<Coach> {
    const [coach] = await db.insert(coaches).values(insertCoach).returning();
    return coach;
  }

  async getAllCoaches(): Promise<Coach[]> {
    return await db.select().from(coaches)
      .where(eq(coaches.isActive, true))
      .orderBy(asc(coaches.name));
  }

  async getCoachById(id: number): Promise<Coach | undefined> {
    const [coach] = await db.select().from(coaches).where(eq(coaches.id, id));
    return coach || undefined;
  }

  async updateCoachAvailability(id: number, availability: any): Promise<Coach> {
    const [updatedCoach] = await db.update(coaches)
      .set({ availability })
      .where(eq(coaches.id, id))
      .returning();

    if (!updatedCoach) {
      throw new Error(`Coach with id ${id} not found`);
    }

    return updatedCoach;
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users)
      .orderBy(asc(users.name));
  }
  
  async getAllReservations(): Promise<Reservation[]> {
    return await db.select().from(reservations)
      .orderBy(asc(reservations.date));
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
    
    // Check if coaches already exist
    const existingCoaches = await db.select().from(coaches);
    if (existingCoaches.length === 0) {
      // Add sample coaches
      const sampleCoaches: InsertCoach[] = [
        {
          name: "田中 智子",
          email: "tanaka.satoko@mental-ai.jp",
          specialty: "anxiety",
          bio: "10年以上の臨床経験を持つ心理カウンセラー。不安障害と自己肯定感向上を専門としています。",
          imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80",
          availability: JSON.stringify([
            {
              day: "月曜日",
              slots: ["10:00", "11:00", "14:00", "15:00", "16:00"]
            },
            {
              day: "水曜日",
              slots: ["13:00", "14:00", "15:00", "16:00", "17:00"]
            },
            {
              day: "金曜日",
              slots: ["10:00", "11:00", "12:00"]
            }
          ]),
          isActive: true
        },
        {
          name: "佐藤 健太",
          email: "sato.kenta@mental-ai.jp",
          specialty: "career",
          bio: "経営コンサルタントからキャリアコーチに転向。キャリア不安や職場でのストレス対処を得意としています。",
          imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80",
          availability: JSON.stringify([
            {
              day: "火曜日",
              slots: ["18:00", "19:00", "20:00"]
            },
            {
              day: "木曜日",
              slots: ["18:00", "19:00", "20:00"]
            },
            {
              day: "土曜日",
              slots: ["10:00", "11:00", "12:00", "13:00", "14:00"]
            }
          ]),
          isActive: true
        }
      ];

      await db.insert(coaches).values(sampleCoaches);
    }
  }
}
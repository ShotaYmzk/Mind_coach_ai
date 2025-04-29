import {
  type User,
  type InsertUser,
  type MoodEntry,
  type InsertMoodEntry,
  type Goal,
  type InsertGoal,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type Assessment,
  type InsertAssessment,
  type Resource,
  type InsertResource
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // MoodEntry methods
  createMoodEntry(moodEntry: InsertMoodEntry): Promise<MoodEntry>;
  getMoodEntriesByUserId(userId: number, limit?: number): Promise<MoodEntry[]>;
  
  // Goal methods
  createGoal(goal: InsertGoal): Promise<Goal>;
  getGoalsByUserId(userId: number): Promise<Goal[]>;
  updateGoalProgress(id: number, progress: number): Promise<Goal>;
  
  // ChatSession methods
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSessionsByUserId(userId: number): Promise<ChatSession[]>;
  getChatSessionById(id: number): Promise<ChatSession | undefined>;
  
  // ChatMessage methods
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesBySessionId(sessionId: number): Promise<ChatMessage[]>;
  
  // Assessment methods
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessmentsByUserId(userId: number): Promise<Assessment[]>;
  
  // Resource methods
  createResource(resource: InsertResource): Promise<Resource>;
  getAllResources(): Promise<Resource[]>;
  getResourceById(id: number): Promise<Resource | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private moodEntries: Map<number, MoodEntry>;
  private goals: Map<number, Goal>;
  private chatSessions: Map<number, ChatSession>;
  private chatMessages: Map<number, ChatMessage>;
  private assessments: Map<number, Assessment>;
  private resources: Map<number, Resource>;
  
  private currentUserId: number;
  private currentMoodEntryId: number;
  private currentGoalId: number;
  private currentChatSessionId: number;
  private currentChatMessageId: number;
  private currentAssessmentId: number;
  private currentResourceId: number;

  constructor() {
    this.users = new Map();
    this.moodEntries = new Map();
    this.goals = new Map();
    this.chatSessions = new Map();
    this.chatMessages = new Map();
    this.assessments = new Map();
    this.resources = new Map();
    
    this.currentUserId = 1;
    this.currentMoodEntryId = 1;
    this.currentGoalId = 1;
    this.currentChatSessionId = 1;
    this.currentChatMessageId = 1;
    this.currentAssessmentId = 1;
    this.currentResourceId = 1;
    
    // Add sample resources
    this.initializeResources();
  }

  private initializeResources() {
    const sampleResources: InsertResource[] = [
      {
        title: "ストレス管理のためのマインドフルネス実践ガイド",
        description: "日常生活にマインドフルネスを取り入れる方法を解説します。",
        type: "article",
        estimatedTime: "7分で読めます",
        url: "/resources/mindfulness-guide"
      },
      {
        title: "眠りを改善するための5つの習慣",
        description: "より良い睡眠のために今日から始められる簡単な習慣を紹介します。",
        type: "video",
        estimatedTime: "4分動画",
        url: "/resources/better-sleep-habits"
      },
      {
        title: "リラックスのための瞑想ガイド",
        description: "初心者でも簡単に実践できるガイド付き瞑想セッション。",
        type: "audio",
        estimatedTime: "10分オーディオ",
        url: "/resources/meditation-guide"
      }
    ];
    
    sampleResources.forEach(resource => {
      this.createResource(resource);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  // MoodEntry methods
  async createMoodEntry(insertMoodEntry: InsertMoodEntry): Promise<MoodEntry> {
    const id = this.currentMoodEntryId++;
    const createdAt = new Date();
    const moodEntry: MoodEntry = { ...insertMoodEntry, id, createdAt };
    this.moodEntries.set(id, moodEntry);
    return moodEntry;
  }
  
  async getMoodEntriesByUserId(userId: number, limit?: number): Promise<MoodEntry[]> {
    const entries = Array.from(this.moodEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? entries.slice(0, limit) : entries;
  }
  
  // Goal methods
  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.currentGoalId++;
    const createdAt = new Date();
    const goal: Goal = { ...insertGoal, id, createdAt };
    this.goals.set(id, goal);
    return goal;
  }
  
  async getGoalsByUserId(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values())
      .filter(goal => goal.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async updateGoalProgress(id: number, progress: number): Promise<Goal> {
    const goal = this.goals.get(id);
    if (!goal) {
      throw new Error(`Goal with id ${id} not found`);
    }
    
    const completed = progress >= 100;
    const updatedGoal: Goal = { ...goal, progress, completed };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  // ChatSession methods
  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = this.currentChatSessionId++;
    const createdAt = new Date();
    const session: ChatSession = { ...insertSession, id, createdAt };
    this.chatSessions.set(id, session);
    return session;
  }
  
  async getChatSessionsByUserId(userId: number): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getChatSessionById(id: number): Promise<ChatSession | undefined> {
    return this.chatSessions.get(id);
  }
  
  // ChatMessage methods
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const createdAt = new Date();
    const message: ChatMessage = { ...insertMessage, id, createdAt };
    this.chatMessages.set(id, message);
    return message;
  }
  
  async getChatMessagesBySessionId(sessionId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  // Assessment methods
  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const id = this.currentAssessmentId++;
    const createdAt = new Date();
    const assessment: Assessment = { ...insertAssessment, id, createdAt };
    this.assessments.set(id, assessment);
    return assessment;
  }
  
  async getAssessmentsByUserId(userId: number): Promise<Assessment[]> {
    return Array.from(this.assessments.values())
      .filter(assessment => assessment.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  // Resource methods
  async createResource(insertResource: InsertResource): Promise<Resource> {
    const id = this.currentResourceId++;
    const createdAt = new Date();
    const resource: Resource = { ...insertResource, id, createdAt };
    this.resources.set(id, resource);
    return resource;
  }
  
  async getAllResources(): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .sort((a, b) => a.title.localeCompare(b.title));
  }
  
  async getResourceById(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }
}

export const storage = new MemStorage();

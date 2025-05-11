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
  type InsertResource,
  type Reservation,
  type InsertReservation,
  type Coach,
  type InsertCoach
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
  
  // Reservation methods
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  getReservationsByUserId(userId: number): Promise<Reservation[]>;
  getReservationById(id: number): Promise<Reservation | undefined>;
  updateReservationStatus(id: number, status: string): Promise<Reservation>;
  updateReservationMeetingUrl(id: number, meetingUrl: string): Promise<Reservation>;
  updateReservationNotes(id: number, notes: string): Promise<Reservation>;
  
  // Coach methods
  createCoach(coach: InsertCoach): Promise<Coach>;
  getAllCoaches(): Promise<Coach[]>;
  getCoachById(id: number): Promise<Coach | undefined>;
  updateCoachAvailability(id: number, availability: any): Promise<Coach>;
  
  // Admin methods
  getAllUsers(): Promise<User[]>;
  getAllReservations(): Promise<Reservation[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private moodEntries: Map<number, MoodEntry>;
  private goals: Map<number, Goal>;
  private chatSessions: Map<number, ChatSession>;
  private chatMessages: Map<number, ChatMessage>;
  private assessments: Map<number, Assessment>;
  private resources: Map<number, Resource>;
  private reservations: Map<number, Reservation>;
  private coaches: Map<number, Coach>;
  
  private currentUserId: number;
  private currentMoodEntryId: number;
  private currentGoalId: number;
  private currentChatSessionId: number;
  private currentChatMessageId: number;
  private currentAssessmentId: number;
  private currentResourceId: number;
  private currentReservationId: number;
  private currentCoachId: number;

  constructor() {
    this.users = new Map();
    this.moodEntries = new Map();
    this.goals = new Map();
    this.chatSessions = new Map();
    this.chatMessages = new Map();
    this.assessments = new Map();
    this.resources = new Map();
    this.reservations = new Map();
    this.coaches = new Map();
    
    this.currentUserId = 1;
    this.currentMoodEntryId = 1;
    this.currentGoalId = 1;
    this.currentChatSessionId = 1;
    this.currentChatMessageId = 1;
    this.currentAssessmentId = 1;
    this.currentResourceId = 1;
    this.currentReservationId = 1;
    this.currentCoachId = 1;
    
    // Add sample resources
    this.initializeResources();
    
    // Add sample coaches
    this.initializeCoaches();
  }
  
  private initializeCoaches() {
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
    
    sampleCoaches.forEach(coach => {
      this.createCoach(coach);
    });
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
  
  // Reservation methods
  async createReservation(insertReservation: InsertReservation): Promise<Reservation> {
    const id = this.currentReservationId++;
    const createdAt = new Date();
    
    // Generate a meeting URL for this reservation
    const meetingUrl = `https://meet.google.com/${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
    
    const reservation: Reservation = { 
      ...insertReservation, 
      id, 
      createdAt,
      meetingUrl
    };
    this.reservations.set(id, reservation);
    return reservation;
  }
  
  async getReservationsByUserId(userId: number): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .filter(reservation => reservation.userId === userId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async getReservationById(id: number): Promise<Reservation | undefined> {
    return this.reservations.get(id);
  }
  
  async updateReservationStatus(id: number, status: string): Promise<Reservation> {
    const reservation = this.reservations.get(id);
    if (!reservation) {
      throw new Error(`Reservation with id ${id} not found`);
    }
    
    const updatedReservation: Reservation = { ...reservation, status };
    this.reservations.set(id, updatedReservation);
    return updatedReservation;
  }
  
  async updateReservationMeetingUrl(id: number, meetingUrl: string): Promise<Reservation> {
    const reservation = this.reservations.get(id);
    if (!reservation) {
      throw new Error(`Reservation with id ${id} not found`);
    }
    
    const updatedReservation: Reservation = { ...reservation, meetingUrl };
    this.reservations.set(id, updatedReservation);
    return updatedReservation;
  }
  
  async updateReservationNotes(id: number, notes: string): Promise<Reservation> {
    const reservation = this.reservations.get(id);
    if (!reservation) {
      throw new Error(`Reservation with id ${id} not found`);
    }
    
    const updatedReservation: Reservation = { ...reservation, notes };
    this.reservations.set(id, updatedReservation);
    return updatedReservation;
  }
  
  // Coach methods
  async createCoach(insertCoach: InsertCoach): Promise<Coach> {
    const id = this.currentCoachId++;
    const createdAt = new Date();
    const coach: Coach = { ...insertCoach, id, createdAt };
    this.coaches.set(id, coach);
    return coach;
  }
  
  async getAllCoaches(): Promise<Coach[]> {
    return Array.from(this.coaches.values())
      .filter(coach => coach.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async getCoachById(id: number): Promise<Coach | undefined> {
    return this.coaches.get(id);
  }
  
  async updateCoachAvailability(id: number, availability: any): Promise<Coach> {
    const coach = this.coaches.get(id);
    if (!coach) {
      throw new Error(`Coach with id ${id} not found`);
    }
    
    const updatedCoach: Coach = { ...coach, availability };
    this.coaches.set(id, updatedCoach);
    return updatedCoach;
  }
  
  // Admin methods
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async getAllReservations(): Promise<Reservation[]> {
    return Array.from(this.reservations.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}

// Import DatabaseStorage class
import { DatabaseStorage } from "./database-storage";

// Create storage instance with DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();

// Seed initial data
storage.seedInitialData().catch(err => {
  console.error("Error seeding initial data:", err);
});

import { pgTable, text, serial, integer, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  location: text("location"),
  avatarUrl: text("avatar_url"),
  planType: text("plan_type").default("free").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// MoodEntry model for tracking user's mood
export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(),
  notes: text("notes"),          // 実際のDB列名は 'notes'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  createdAt: true,
});

// Goals model
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  progress: integer("progress").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
});

// ChatSession model
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
});

// ChatMessage model
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  content: text("content").notNull(),
  isUser: boolean("is_user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Assessment model
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'general', 'stress', 'depression', 'anxiety', 'burnout'
  results: json("results").notNull(),
  score: integer("score"),
  // 実際のDBでは summary と recommendations カラムは存在しないため、型定義上では残すが実装時は考慮する
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});

// Resources model
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'article', 'video', 'audio'
  estimatedTime: text("estimated_time"),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
});

// Coaching Reservations model
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  coachId: integer("coach_id"), // Optional, will be assigned later
  date: timestamp("date").notNull(),
  duration: integer("duration").default(60).notNull(), // minutes
  status: text("status").default("pending").notNull(), // 'pending', 'confirmed', 'cancelled'
  meetingUrl: text("meeting_url"), // Google Meet URL
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  createdAt: true,
});

// Coaches model
export const coaches = pgTable("coaches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  specialty: text("specialty").notNull(), // e.g. 'anxiety', 'depression', 'career'
  bio: text("bio").notNull(),
  imageUrl: text("image_url"),
  availability: json("availability").notNull(), // JSON array of available time slots
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCoachSchema = createInsertSchema(coaches).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;

export type Coach = typeof coaches.$inferSelect;
export type InsertCoach = z.infer<typeof insertCoachSchema>;

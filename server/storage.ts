import { 
  profiles, 
  events, 
  challenges, 
  wallets, 
  notifications,
  messages,
  eventChatMessages,
  type Profile, 
  type InsertProfile, 
  type Event,
  type InsertEvent,
  type Challenge,
  type InsertChallenge,
  type Wallet,
  type InsertWallet,
  type Notification,
  type InsertNotification,
  type Message,
  type InsertMessage,
  // Legacy compatibility
  type User, 
  type InsertUser 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User/Profile methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;

  // Event methods
  getEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // Challenge methods
  getChallenges(): Promise<Challenge[]>;
  getChallenge(id: string): Promise<Challenge | undefined>;
  getUserChallenges(userId: string): Promise<Challenge[]>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: string, challenge: Partial<InsertChallenge>): Promise<Challenge | undefined>;

  // Wallet methods
  getUserWallet(userId: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWalletBalance(userId: string, realBalance?: number, bonusBalance?: number): Promise<Wallet | undefined>;

  // Notification methods
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<Notification | undefined>;

  // Message methods
  getChatMessages(chatId: string, limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getEventChatMessages(eventId: string, limit?: number): Promise<any[]>;
  createEventChatMessage(message: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User/Profile methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.name, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.phone, phone)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(profiles).values({
      ...user,
      id: crypto.randomUUID()
    }).returning();
    return result[0];
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(profiles).set({
      ...user,
      updatedAt: new Date()
    }).where(eq(profiles.id, id)).returning();
    return result[0];
  }

  // Event methods
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.createdAt));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
    return result[0];
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const result = await db.update(events).set({
      ...event,
      updatedAt: new Date()
    }).where(eq(events.id, id)).returning();
    return result[0];
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }

  // Challenge methods
  async getChallenges(): Promise<Challenge[]> {
    return await db.select().from(challenges).orderBy(desc(challenges.createdAt));
  }

  async getChallenge(id: string): Promise<Challenge | undefined> {
    const result = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
    return result[0];
  }

  async getUserChallenges(userId: string): Promise<Challenge[]> {
    return await db.select().from(challenges).where(
      and(
        eq(challenges.challengerId, userId),
        eq(challenges.challengedId, userId)
      )
    ).orderBy(desc(challenges.createdAt));
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const result = await db.insert(challenges).values(challenge).returning();
    return result[0];
  }

  async updateChallenge(id: string, challenge: Partial<InsertChallenge>): Promise<Challenge | undefined> {
    const result = await db.update(challenges).set(challenge).where(eq(challenges.id, id)).returning();
    return result[0];
  }

  // Wallet methods
  async getUserWallet(userId: string): Promise<Wallet | undefined> {
    const result = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    return result[0];
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const result = await db.insert(wallets).values(wallet).returning();
    return result[0];
  }

  async updateWalletBalance(userId: string, realBalance?: number, bonusBalance?: number): Promise<Wallet | undefined> {
    const updateData: Partial<InsertWallet> = {};
    if (realBalance !== undefined) updateData.realBalance = realBalance.toString();
    if (bonusBalance !== undefined) updateData.bonusBalance = bonusBalance.toString();

    const result = await db.update(wallets).set(updateData).where(eq(wallets.userId, userId)).returning();
    return result[0];
  }

  // Notification methods
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const result = await db.update(notifications).set({
      isRead: true,
      readAt: new Date()
    }).where(eq(notifications.id, id)).returning();
    return result[0];
  }

  // Message methods
  async getChatMessages(chatId: string, limit: number = 50): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async getEventChatMessages(eventId: string, limit: number = 50): Promise<any[]> {
    return await db.select().from(eventChatMessages)
      .where(eq(eventChatMessages.eventId, eventId))
      .orderBy(desc(eventChatMessages.createdAt))
      .limit(limit);
  }

  async createEventChatMessage(message: any): Promise<any> {
    const result = await db.insert(eventChatMessages).values(message).returning();
    return result[0];
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private events: Map<string, Event>;
  private challenges: Map<string, Challenge>;
  private wallets: Map<string, Wallet>;
  private notifications: Map<string, Notification>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.challenges = new Map();
    this.wallets = new Map();
    this.notifications = new Map();
    this.messages = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.name === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phone === phone,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = { 
      id,
      email: insertUser.email ?? null,
      name: insertUser.name ?? null,
      avatarUrl: insertUser.avatarUrl ?? null,
      status: insertUser.status ?? null,
      phone: insertUser.phone ?? null,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Event methods - implement similar patterns for other entities
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const id = crypto.randomUUID();
    const newEvent: Event = {
      id,
      status: event.status ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      creatorId: event.creatorId ?? null,
      title: event.title,
      description: event.description ?? null,
      category: event.category ?? null,
      eventType: event.eventType ?? null,
      entryAmount: event.entryAmount ?? null,
      maxParticipants: event.maxParticipants ?? null,
      startDate: event.startDate ?? null,
      endDate: event.endDate ?? null,
      isPrivate: event.isPrivate ?? null,
      inviteCode: event.inviteCode ?? null,
      winningPrediction: event.winningPrediction ?? null
    };
    this.events.set(id, newEvent);
    return newEvent;
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) return undefined;
    
    const updatedEvent = { ...existingEvent, ...event, updatedAt: new Date() };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  // Placeholder implementations for other methods
  async getChallenges(): Promise<Challenge[]> { return []; }
  async getChallenge(id: string): Promise<Challenge | undefined> { return undefined; }
  async getUserChallenges(userId: string): Promise<Challenge[]> { return []; }
  async createChallenge(challenge: InsertChallenge): Promise<Challenge> { throw new Error("Not implemented"); }
  async updateChallenge(id: string, challenge: Partial<InsertChallenge>): Promise<Challenge | undefined> { return undefined; }

  async getUserWallet(userId: string): Promise<Wallet | undefined> { return undefined; }
  async createWallet(wallet: InsertWallet): Promise<Wallet> { throw new Error("Not implemented"); }
  async updateWalletBalance(userId: string, realBalance?: number, bonusBalance?: number): Promise<Wallet | undefined> { return undefined; }

  async getUserNotifications(userId: string): Promise<Notification[]> { return []; }
  async createNotification(notification: InsertNotification): Promise<Notification> { throw new Error("Not implemented"); }
  async markNotificationRead(id: string): Promise<Notification | undefined> { return undefined; }

  async getChatMessages(chatId: string, limit?: number): Promise<Message[]> { return []; }
  async createMessage(message: InsertMessage): Promise<Message> { throw new Error("Not implemented"); }
  async getEventChatMessages(eventId: string, limit?: number): Promise<any[]> { return []; }
  async createEventChatMessage(message: any): Promise<any> { throw new Error("Not implemented"); }
}

// Temporarily use MemStorage to avoid TypeScript issues during migration
export const storage = new MemStorage();

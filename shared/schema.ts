import { 
  pgTable, 
  text, 
  uuid, 
  integer, 
  boolean, 
  timestamp, 
  decimal, 
  jsonb,
  pgEnum,
  varchar,
  unique,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const walletBalanceTypeEnum = pgEnum("wallet_balance_type", ["real", "bonus"]);
export const challengeStatusEnum = pgEnum("challenge_status", ["pending", "accepted", "completed", "cancelled", "missed"]);
export const eventStatusEnum = pgEnum("event_status", ["pending", "active", "completed", "cancelled"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "direct_message", 
  "event_update", 
  "challenge_request", 
  "challenge_accepted", 
  "challenge_completed", 
  "payment", 
  "system", 
  "wallet",
  "event_join_request",
  "event_participant_added"
]);

// Users/Profiles table
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  status: text("status"),
  phone: text("phone"),
  email: text("email"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wallets
export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }),
  realBalance: decimal("real_balance", { precision: 10, scale: 2 }).default("0"),
  bonusBalance: decimal("bonus_balance", { precision: 10, scale: 2 }).default("1000"),
  lockedBalance: decimal("locked_balance", { precision: 10, scale: 2 }).default("0"),
  currency: text("currency").default("NGN"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wallet Transactions
export const walletTransactions = pgTable("wallet_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id").references(() => wallets.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceType: walletBalanceTypeEnum("balance_type").notNull(),
  reference: text("reference").notNull(),
  description: text("description"),
  metadata: jsonb("metadata").default({}),
  status: text("status").default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").references(() => profiles.id),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  eventType: text("event_type").default("public"),
  status: eventStatusEnum("status").default("pending"),
  entryAmount: decimal("entry_amount", { precision: 10, scale: 2 }).default("0"),
  maxParticipants: integer("max_participants"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isPrivate: boolean("is_private").default(false),
  inviteCode: text("invite_code"),
  winningPrediction: text("winning_prediction"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event Participants
export const eventParticipants = pgTable("event_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }),
  prediction: text("prediction"),
  wager: decimal("wager", { precision: 10, scale: 2 }),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  uniqueEventUser: unique().on(table.eventId, table.userId),
}));

// Challenges
export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  challengerId: uuid("challenger_id").references(() => profiles.id),
  challengedId: uuid("challenged_id").references(() => profiles.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  gameType: varchar("game_type").notNull(),
  platform: varchar("platform").notNull(),
  status: challengeStatusEnum("status").default("pending"),
  winnerId: uuid("winner_id").references(() => profiles.id),
  requiredEvidence: text("required_evidence"),
  gameDetails: jsonb("game_details").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  challengerIdIdx: index("challenges_challenger_id_idx").on(table.challengerId),
  challengedIdIdx: index("challenges_challenged_id_idx").on(table.challengedId),
  statusIdx: index("challenges_status_idx").on(table.status),
}));

// Chats
export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(), // 'private', 'event', 'challenge'
  name: text("name"),
  relatedId: uuid("related_id"), // event_id or challenge_id
  createdBy: uuid("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat Participants
export const chatParticipants = pgTable("chat_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").references(() => chats.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastReadAt: timestamp("last_read_at"),
}, (table) => ({
  uniqueChatUser: unique().on(table.chatId, table.userId),
}));

// Messages
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").references(() => chats.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").references(() => profiles.id),
  content: text("content"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  replyToId: uuid("reply_to_id"),
  mentions: uuid("mentions").array(),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event Chat Messages (separate from regular messages)
export const eventChatMessages = pgTable("event_chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").references(() => profiles.id, { onDelete: "cascade" }),
  content: text("content"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  replyToId: uuid("reply_to_id"),
  mentions: uuid("mentions").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  eventIdIdx: index("idx_event_chat_messages_event_id").on(table.eventId),
  senderIdIdx: index("idx_event_chat_messages_sender_id").on(table.senderId),
}));

// Notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }),
  notificationType: notificationTypeEnum("notification_type").notNull(),
  relatedId: uuid("related_id"),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("notifications_user_id_idx").on(table.userId),
  typeIdx: index("notifications_type_idx").on(table.notificationType),
}));

// Stories
export const stories = pgTable("stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }),
  content: text("content"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"), // 'image', 'video'
  isActive: boolean("is_active").default(true),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Relations
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [profiles.id],
    references: [wallets.userId],
  }),
  createdEvents: many(events),
  eventParticipations: many(eventParticipants),
  challengesAsChallenger: many(challenges, { relationName: "challengerChallenges" }),
  challengesAsChallenged: many(challenges, { relationName: "challengedChallenges" }),
  challengeWins: many(challenges, { relationName: "challengeWins" }),
  sentMessages: many(messages),
  chatParticipations: many(chatParticipants),
  notifications: many(notifications),
  stories: many(stories),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(profiles, {
    fields: [wallets.userId],
    references: [profiles.id],
  }),
  transactions: many(walletTransactions),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [events.creatorId],
    references: [profiles.id],
  }),
  participants: many(eventParticipants),
  chatMessages: many(eventChatMessages),
}));

export const challengesRelations = relations(challenges, ({ one }) => ({
  challenger: one(profiles, {
    fields: [challenges.challengerId],
    references: [profiles.id],
    relationName: "challengerChallenges",
  }),
  challenged: one(profiles, {
    fields: [challenges.challengedId],
    references: [profiles.id],
    relationName: "challengedChallenges",
  }),
  winner: one(profiles, {
    fields: [challenges.winnerId],
    references: [profiles.id],
    relationName: "challengeWins",
  }),
}));

// Insert schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  editedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

// Types
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Legacy compatibility
export const users = profiles;
export const insertUserSchema = insertProfileSchema;
export type InsertUser = InsertProfile;
export type User = Profile;

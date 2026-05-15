import { index, integer, uniqueIndex, text, boolean, timestamp, uuid, pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow(),
});

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id")
      .primaryKey()
      .defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at")
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_refresh_tokens_user").on(table.userId),
    index("idx_refresh_tokens_token").on(table.token),
  ],
);

export const polls = pgTable("polls", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").notNull().references(()=> users.id, {onDelete: "cascade"}),
  question: text("question").notNull(),
  description: text("description"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp ("updated_at").notNull().defaultNow(),
}, (table)=> [
  index("idx_polls_creator").on(table.creatorId),
  index("idx_polls_active").on(table.isActive),
]);

export const pollOptions = pgTable("poll_options",{
  id: uuid("id").primaryKey().defaultRandom(),
  pollId: uuid("poll_id").notNull().references(()=>polls.id, {onDelete: "cascade"}),
  text: text("text").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table)=>[
  index("idx_poll_options_poll").on(table.pollId),
]);

export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  pollId: uuid("poll_id").notNull().references(()=> polls.id, {onDelete: "cascade"}),
  optionId: uuid("option_id").notNull().references(()=> pollOptions.id, {onDelete:"cascade"}),
  userId: uuid("user_id").references(()=> users.id, {onDelete:"cascade"}),
  voterFingerPrint: text("voter_fingerprint").notNull(),
  IPHash: text("ip_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table)=> [
  index("idx_votes_poll").on(table.pollId),
  index("idx_votes_option").on(table.optionId),
  index("idx_votes_user").on(table.userId),

  uniqueIndex("idx_votes_user_poll").on(table.userId, table.pollId),
  uniqueIndex("idx_votes_fingerprint_poll").on(table.voterFingerPrint, table.pollId)
]);

// Relations
export const pollsRelations = relations(polls, ({ one, many }) => ({
  creator: one(users, { fields: [polls.creatorId], references: [users.id] }),
  options: many(pollOptions),
  votes: many(votes),
}));

export const pollOptionsRelations = relations(pollOptions, ({ one, many }) => ({
  poll: one(polls, { fields: [pollOptions.pollId], references: [polls.id] }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  poll: one(polls, { fields: [votes.pollId], references: [polls.id] }),
  option: one(pollOptions, { fields: [votes.optionId], references: [pollOptions.id] }),
  user: one(users, { fields: [votes.userId], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  polls: many(polls),
  votes: many(votes),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

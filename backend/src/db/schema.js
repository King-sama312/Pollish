import { index, integer, uniqueIndex, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const refreshTokens = sqliteTable(
  "refresh_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_refresh_tokens_user").on(table.userId),
    index("idx_refresh_tokens_token").on(table.token),
  ],
);

export const polls = sqliteTable("polls", {
  id: text("id").primaryKey().$defaultFn(()=>crypto.randomUUID()),
  creatorId: text("creator_id").notNull().references(()=> users.id, {onDelete: "cascade"}),
  question: text("question").notNull(),
  description: text("description"),
  isAnonymous: integer("is_anonymous", {mode: "boolean"}).notNull().default(false),
  allowMultipleChoices: integer("allow_multiple_choices", {mode: "boolean"}).notNull().default(false),
  isActive: integer("is_active", {mode:"boolean"}).notNull().default(true),
  endsAt: integer("ends_at", {mode: "timestamp"}),
  createdAt: integer("created_at", {mode: "timestamp"}).notNull().$defaultFn(()=> new Date()),
  updatedAt: integer ("updated_at", {mode: "timestamp"}).notNull().$defaultFn(()=> new Date()),

}, (table)=> [
  index("idx_polls_creator").on(table.creatorId),
  index("idx_polls_active").on(table.isActive),
])

export const pollOptions= sqliteTable("poll_options",{
  id: text("id").primaryKey().$defaultFn(()=> crypto.randomUUID()),
  pollId: text("poll_id").notNull().references(()=>polls.id, {onDelete: "cascade"}),
  text:text("text").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: integer("created_at", {mode: "timestamp"}).notNull().$defaultFn(()=> new Date()),
}, (table)=>[
  index("idx_poll_options_poll").on(table.pollId),
])

export const votes = sqliteTable("votes", {
  id: text("id").primaryKey().$defaultFn(()=> crypto.randomUUID()),
  pollId: text("poll_id").notNull().references(()=> polls.id, {onDelete: "cascade"}),
  optionId: text("option_id").notNull().references(()=> pollOptions.id, {onDelete:"cascade"}),
  userId: text("user_id").references(()=> users.id, {onDelete:"cascade"}),
  voterFingerPrint: text("voter_fingerprint").notNull(),
  IPHash: text("ip_hash"),
  createdAt: integer("created_at", {mode: "timestamp"}).notNull().$defaultFn(()=> new Date()),
}, (table)=> [
  index("idx_votes_poll").on(table.pollId),
  index("idx_votes_option").on(table.optionId),
  index("idx_votes_user").on(table.userId),

  uniqueIndex("idx_votes_user_poll").on(table.userId, table.pollId),
  uniqueIndex("idx_votes_fingerprint_poll").on(table.voterFingerPrint, table.pollId)
])

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

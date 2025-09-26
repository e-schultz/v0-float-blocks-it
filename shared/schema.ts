import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const blocks = pgTable("blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  contentType: varchar("content_type").notNull().default("text"), // text, code, markdown
  position: jsonb("position").$type<{ x: number; y: number }>().default({ x: 0, y: 0 }),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  authorId: varchar("author_id").notNull(),
  authorName: varchar("author_name").notNull(),
});

export const links = pgTable("links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromBlockId: varchar("from_block_id").notNull().references(() => blocks.id, { onDelete: "cascade" }),
  toBlockId: varchar("to_block_id").notNull().references(() => blocks.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blockId: varchar("block_id").notNull().references(() => blocks.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  authorName: varchar("author_name").notNull(),
  parentId: varchar("parent_id").references((): any => comments.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBlockSchema = createInsertSchema(blocks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLinkSchema = createInsertSchema(links).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type InsertLink = z.infer<typeof insertLinkSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Block = typeof blocks.$inferSelect;
export type Link = typeof links.$inferSelect;
export type Comment = typeof comments.$inferSelect;

// Extended types for API responses
export type BlockWithLinks = Block & {
  linkedTo: Block[];
  linkedFrom: Block[];
  comments: Comment[];
  linkCount: number;
  commentCount: number;
};

export type CommentWithReplies = Comment & {
  replies: CommentWithReplies[];
};

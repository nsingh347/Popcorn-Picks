import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const moviePreferences = pgTable("movie_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  movieId: integer("movie_id").notNull(),
  preference: text("preference").notNull(), // 'like' or 'dislike'
  genreIds: jsonb("genre_ids").$type<number[]>().default([]),
});

export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  movieId: integer("movie_id").notNull(),
  addedAt: text("added_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPreferenceSchema = createInsertSchema(moviePreferences).pick({
  movieId: true,
  preference: true,
  genreIds: true,
});

export const insertWatchlistSchema = createInsertSchema(watchlist).pick({
  movieId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type MoviePreference = typeof moviePreferences.$inferSelect;
export type InsertPreference = z.infer<typeof insertPreferenceSchema>;
export type WatchlistItem = typeof watchlist.$inferSelect;
export type InsertWatchlistItem = z.infer<typeof insertWatchlistSchema>;

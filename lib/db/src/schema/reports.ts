import { pgTable, serial, text, real, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  transcript: text("transcript").notNull(),
  riskLevel: text("risk_level").notNull(),
  riskScore: real("risk_score").notNull(),
  confidence: real("confidence").notNull(),
  features: jsonb("features").notNull(),
  problematicPatterns: jsonb("problematic_patterns").notNull().$type<string[]>(),
  recommendations: jsonb("recommendations").notNull().$type<string[]>(),
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, createdAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;

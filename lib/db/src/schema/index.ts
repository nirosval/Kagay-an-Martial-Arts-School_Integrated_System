import { pgTable, text, integer, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── Players ───────────────────────────────────────────────────────────────
export const playersTable = pgTable("players", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  birthdate: text("birthdate").notNull(),
  age: integer("age").notNull(),
  weight_kg: real("weight_kg").notNull(),
  height_cm: real("height_cm").notNull(),
  year_started: integer("year_started").notNull(),
  membership_status: text("membership_status").notNull(),
  belt_rank: text("belt_rank").notNull(),
  photo_url: text("photo_url"),
  achievements: jsonb("achievements").notNull().default([]),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

export const insertPlayerSchema = createInsertSchema(playersTable);
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type PlayerRow = typeof playersTable.$inferSelect;

// ── Attendance ────────────────────────────────────────────────────────────
export const attendanceTable = pgTable("attendance", {
  id: text("id").primaryKey(),
  player_id: text("player_id").notNull(),
  date: text("date").notNull(),
  time_in: text("time_in").notNull(),
  time_out: text("time_out"),
  status: text("status").notNull(),
});

export const insertAttendanceSchema = createInsertSchema(attendanceTable);
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type AttendanceRow = typeof attendanceTable.$inferSelect;

// ── Staff Attendance ──────────────────────────────────────────────────────
export const staffAttendanceTable = pgTable("staff_attendance", {
  id: text("id").primaryKey(),
  staff_id: text("staff_id").notNull(),
  staff_name: text("staff_name").notNull(),
  staff_role: text("staff_role").notNull(),
  staff_photo_url: text("staff_photo_url"),
  date: text("date").notNull(),
  time_in: text("time_in").notNull(),
  time_out: text("time_out"),
});

export const insertStaffAttendanceSchema = createInsertSchema(staffAttendanceTable);
export type InsertStaffAttendance = z.infer<typeof insertStaffAttendanceSchema>;
export type StaffAttendanceRow = typeof staffAttendanceTable.$inferSelect;

// ── Dues ──────────────────────────────────────────────────────────────────
export const duesTable = pgTable("dues", {
  id: text("id").primaryKey(),
  player_id: text("player_id").notNull(),
  month: text("month").notNull(),
  amount: real("amount").notNull(),
  status: text("status").notNull(),
  paid_date: text("paid_date"),
  notes: text("notes"),
  created_at: text("created_at").notNull(),
});

export const insertDuesSchema = createInsertSchema(duesTable);
export type InsertDues = z.infer<typeof insertDuesSchema>;
export type DuesRow = typeof duesTable.$inferSelect;

// ── Announcements ─────────────────────────────────────────────────────────
export const announcementsTable = pgTable("announcements", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  venue: text("venue"),
  event_date: text("event_date"),
  created_by: text("created_by").notNull(),
  created_by_role: text("created_by_role").notNull(),
  created_at: text("created_at").notNull(),
});

export const insertAnnouncementSchema = createInsertSchema(announcementsTable);
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type AnnouncementRow = typeof announcementsTable.$inferSelect;

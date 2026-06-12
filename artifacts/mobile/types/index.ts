export type UserRole = "sensei" | "senpai" | "coach";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AdminAccount extends AdminUser {
  password: string;
}

export type MembershipStatus = "active_member" | "active_nonmember" | "inactive";

export interface Achievement {
  id: string;
  title: string;
  date: string;
  description?: string;
}

export interface Player {
  id: string;
  name: string;
  birthdate: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  year_started: number;
  membership_status: MembershipStatus;
  belt_rank: string;
  photo_url?: string | null;
  achievements: Achievement[];
  created_at: string;
  updated_at: string;
}

export interface PlayerInput {
  name: string;
  birthdate: string;
  weight_kg: number;
  height_cm: number;
  year_started: number;
  membership_status: MembershipStatus;
  belt_rank: string;
  photo_url?: string | null;
}

export interface PlayerAccount {
  id: string;
  email: string;
  password: string;
  playerId: string;
}

export type AttendanceStatus = "present" | "late";

export interface AttendanceRecord {
  id: string;
  playerId: string;
  date: string;         // YYYY-MM-DD
  time_in: string;      // ISO timestamp
  time_out: string | null;
  status: AttendanceStatus;
}

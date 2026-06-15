export type UserRole = "sensei" | "senpai" | "coach";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  photo_url?: string;
  birthdate?: string; // YYYY-MM-DD
}

export interface AdminAccount extends AdminUser {
  password: string;
}

export type AnnouncementCategory = "tournament" | "belt_promotion" | "general";

export interface Announcement {
  id: string;
  category: AnnouncementCategory;
  title: string;
  body: string;
  venue?: string;
  eventDate?: string; // YYYY-MM-DD
  createdBy: string;
  createdByRole: UserRole;
  createdAt: string; // ISO
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

export interface StaffAttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: UserRole;
  staffPhotoUrl?: string;
  date: string;         // YYYY-MM-DD
  time_in: string;      // ISO timestamp
  time_out: string | null;
}

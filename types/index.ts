export type UserRole = "Freelancer" | "Client" | "Moderator" | "Admin" | "Member";

export interface UserStats {
  rating: number;
  reviewsCount: number;
  exchangesCompleted: number;
  skillHoursEarned: number;
  skillHoursSpent: number;
  completionRate: number; // 0-100
  responseTimeHours: number;
  repeatCollaborations: number;
  disputesLost?: number; // Resolved disputes against user
  reportsAgainst?: number; // Validated reports against user
}

// Deprecated: We now use Record<string, boolean> directly on the user object
export interface UserAchievement {
  id: string;
  title: string;
  icon: string;
  earnedAt: string;
}

export interface UserSkill {
  name: string;
  yearsOfExperience?: number;
  rating?: number; // 1-5
}

export interface User {
  uid: string;
  username: string; // unique handle
  fullName: string;
  email: string;
  photoURL?: string | null;
  profession: string;
  headline?: string;
  country: string;
  timeZone: string;
  createdAt: string; // ISO string
  lastActive: string; // ISO string
  
  bio?: string;
  languages?: string[];
  experienceLevel?: string;
  availability?: string; // e.g., "10-20 hours/week"
  schedule?: UserSchedule;
  
  skillsOffered: string[] | UserSkill[];
  skillsLookingFor: string[];
  
  stats: UserStats;
  trustScore: number; // 0-100
  achievements?: Record<string, boolean> | UserAchievement[]; // Support both for migration
  isVerified: boolean;
  
  profileCompletion: number; // 0-100

  // Admin / Operational fields
  skillHours?: number; // Current balance
  role?: UserRole;
  status?: "active" | "suspended" | "banned";
  adminNotes?: string;
}

export interface PortfolioItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  imageURL?: string;
  link?: string;
  technologies: string[];
  createdAt: string; // ISO string
}

export type ExchangeStatus = "pending" | "in_progress" | "completed" | "disputed" | "cancelled";

export interface Exchange {
  id: string;
  title: string;
  providerId: string;
  receiverId: string;
  skillHours: number;
  status: ExchangeStatus;
  completedAt?: string | null;
  createdAt: string; // ISO string
}

export interface Review {
  id: string;
  exchangeId: string;
  reviewerId: string;
  targetUserId: string;
  rating: number; // 1-5
  comment: string;
  isPositive: boolean;
  createdAt: string; // ISO string
}

export interface DaySchedule {
  active: boolean;
  start: string; // "09:00"
  end: string;   // "17:00"
}

export interface UserSchedule {
  timezone: string;
  weeklySchedule: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
  blockedDates: string[]; // ["2026-10-14"]
}

export type ExchangeRequestStatus = "pending" | "reviewing" | "accepted" | "rejected";

export interface ExchangeRequest {
  id: string;
  senderId: string; // The visitor requesting the exchange
  receiverId: string; // The profile owner
  skillNeeded: string; // Name of the skill from receiver's offered skills
  dateOptions: string[]; // ["2026-10-14", "2026-10-15"]
  
  // Either specific time or total hours needed
  timeNeeded?: string; // "14:00"
  hoursNeeded?: number; // e.g., 2
  
  message?: string;
  status: ExchangeRequestStatus;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type NotificationType = "exchange_request" | "request_update" | "system";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  relatedId?: string; // e.g., requestId
  createdAt: string; // ISO string
}

export interface SkillLedgerEntry {
  id: string;
  userId: string;
  amount: number; // positive or negative
  reason: string;
  relatedId?: string; // ID of the exchange or user
  createdAt: string; // ISO string
}

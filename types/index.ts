export type UserRole = "Freelancer" | "Client" | "Admin";

export interface UserStats {
  rating: number;
  reviewsCount: number;
  exchangesCompleted: number;
  skillHoursEarned: number;
  skillHoursSpent: number;
  completionRate: number; // 0-100
  responseTimeHours: number;
  repeatCollaborations: number;
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
  
  skillsOffered: string[] | UserSkill[];
  skillsLookingFor: string[];
  
  stats: UserStats;
  trustScore: number; // 0-100
  achievements?: Record<string, boolean> | UserAchievement[]; // Support both for migration
  isVerified: boolean;
  
  profileCompletion: number; // 0-100
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

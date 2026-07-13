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
  hasPortfolio?: boolean;
  
  profileCompletion: number; // 0-100

  // Admin / Operational fields
  skillHours?: number; // Current balance
  role?: UserRole;
  status?: "active" | "suspended" | "banned";
  adminNotes?: string;

  notificationPreferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  exchangeActivity: boolean;
  marketplace: boolean;
  messages: boolean;
  reviews: boolean;
  community: boolean;
  security: boolean; // Cannot be disabled in UI
  deliveryMethod: {
    inApp: boolean;
    email: boolean;
  };
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

export type ExchangeStatus = "pending_proposal" | "negotiating" | "in_progress" | "in_review" | "revision_requested" | "completed" | "disputed" | "cancelled";

export interface ExchangeMilestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO string
  status: "pending" | "in_progress" | "completed";
}

export interface ExchangeDeliverable {
  id: string;
  version: number;
  files: { name: string; url: string; type: string; size: number }[];
  comments?: string;
  submittedBy?: string; // userId of the submitter (for mutual exchanges)
  uploadedAt: string; // ISO string
}

export interface ExchangeActivity {
  id: string;
  type: "created" | "proposal_accepted" | "files_uploaded" | "milestone_completed" | "revision_requested" | "completed" | "cancelled";
  description: string;
  timestamp: string; // ISO string
  actorId?: string;
}

export interface Exchange {
  id: string;
  requestId?: string;
  applicationId?: string;
  title: string;
  requesterId: string;
  providerId: string;
  skillHours: number;
  status: ExchangeStatus;
  
  // Proposal / Workspace data
  deliverables?: string[]; // Standard exchange deliverables
  
  // Mutual Exchange data
  isMutual?: boolean;
  providerDeliverables?: string[];
  requesterDeliverables?: string[];
  providerSubmittedAt?: string | null;
  requesterSubmittedAt?: string | null;
  providerAcceptedAt?: string | null;
  requesterAcceptedAt?: string | null;

  timelineDays?: number;
  deadline?: string; // ISO string
  revisionsIncluded?: number;
  revisionsUsed?: number;
  
  // Escrow tracking
  escrowStatus?: "pending" | "reserved" | "released" | "refunded";
  providerEscrowStatus?: "pending" | "reserved" | "released" | "refunded"; // For mutual exchanges
  requesterEscrowStatus?: "pending" | "reserved" | "released" | "refunded"; // For mutual exchanges
  
  // Progress
  progress?: number; // 0-100
  milestones?: ExchangeMilestone[];

  completedAt?: string | null;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
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

export type MarketplaceRequestStatus = "open" | "in_progress" | "completed" | "cancelled";

export interface MarketplaceRequest {
  id: string;
  title: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar?: string;
  requesterTrustScore: number;
  requesterVerification: boolean;
  description: string;
  deliverables: string[];
  category: string;
  skillsRequired: string[];
  estimatedHours: string; // e.g. "5-7 Hours" or "10+"
  
  // Mutual Exchange fields
  isMutual?: boolean;
  offeredSkills?: string[];
  offeredDeliverables?: string[];
  offeredHours?: string;
  
  exchangeType: string; // "One-time", "Ongoing", etc.
  timeline: string; // e.g. "Within 2 weeks"
  preferredExperience: string; // "Intermediate"
  preferredTimeZone?: string;
  attachments: { name: string, url: string }[];
  status: MarketplaceRequestStatus;
  applicantsCount: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type MarketplaceApplicationStatus = "pending" | "shortlisted" | "accepted" | "rejected";

export interface MarketplaceApplication {
  id: string;
  requestId: string;
  applicantId: string;
  coverMessage: string;
  portfolioLinks: string[];
  availability: string;
  estimatedHours: number;
  
  // Mutual Exchange fields
  isMutualProposal?: boolean;
  offeredDeliverables?: string[];
  offeredHours?: number;
  
  estimatedCompletionDate?: string; // ISO string
  agreedToTerms: boolean;
  status: MarketplaceApplicationStatus;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
}

export interface MarketplaceFilters {
  category?: string[];
  skills?: string[];
  exchangeType?: string;
  estimatedHours?: string;
  availability?: string;
  verifiedOnly?: boolean;
  minTrustScore?: number;
  minRating?: string;
  experience?: string;
  language?: string[];
  timeZone?: string;
  sort?: string;
}

export type NotificationType = "exchange_request" | "request_update" | "system" | "application_received" | "application_accepted" | "exchange_started" | "milestone_completed" | "file_uploaded" | "revision_requested" | "review_waiting" | "exchange_completed" | "new_match" | "saved_request_updated" | "request_expiring" | "new_professional" | "hours_earned" | "hours_reserved" | "hours_released" | "admin_adjustment" | "new_review" | "skill_endorsement" | "trust_score_increased" | "achievement_unlocked" | "verification_approved" | "profile_incomplete" | "subscription_renewed" | "payment_failed" | "security_alert" | "community_update";

export type NotificationCategory = "Exchanges" | "Marketplace" | "Messages" | "Ledger" | "Reviews" | "Trust Score" | "Achievements" | "Account" | "Billing" | "Community" | "Security" | "System";

export type NotificationPriority = "Critical" | "High" | "Normal" | "Low";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  message: string;
  isRead: boolean;
  isArchived?: boolean;
  link?: string;
  actionLabel?: string; // Optional label for CTA button
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

export type TransactionType = 
  | "Earned"
  | "Spent"
  | "Reserved"
  | "Released"
  | "Refunded"
  | "Adjustment"
  | "Bonus"
  | "Welcome Credit"
  | "Dispute Resolution"
  | "Admin Correction"
  | "Transfer Reversal";

export type TransactionStatus = "Completed" | "Pending" | "Active" | "Failed" | "Disputed";

export interface LedgerTransaction {
  id: string;
  userId: string;
  date: string; // ISO string
  type: TransactionType;
  description: string;
  exchangeId?: string;
  amount: number; // positive or negative
  balanceAfter: number;
  balanceBefore?: number;
  status: TransactionStatus;
  linkedUserId?: string;
  linkedUserName?: string;
  linkedUserAvatar?: string;
  notes?: string;
}
export interface ExchangeMessage { id: string; exchangeId: string; senderId: string; text: string; createdAt: string; isRead?: boolean; }

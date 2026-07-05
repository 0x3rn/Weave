export type AchievementTier = "none" | "bronze" | "silver" | "gold" | "platinum";

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: "Getting Started" | "Collaboration" | "Reputation" | "Economy" | "Expertise" | "Community";
  tier: AchievementTier;
  iconName: string; // We map this to Lucide icons in the UI
}

export const ACHIEVEMENTS: Record<string, AchievementDefinition> = {
  // Getting Started
  welcome_aboard: {
    id: "welcome_aboard",
    title: "Welcome Aboard",
    description: "Complete onboarding.",
    category: "Getting Started",
    tier: "none",
    iconName: "sprout"
  },
  profile_complete: {
    id: "profile_complete",
    title: "Profile Complete",
    description: "Reach 100% profile completion.",
    category: "Getting Started",
    tier: "none",
    iconName: "sparkles"
  },
  first_match: {
    id: "first_match",
    title: "First Match",
    description: "Get matched with another member.",
    category: "Getting Started",
    tier: "none",
    iconName: "target"
  },
  first_exchange: {
    id: "first_exchange",
    title: "First Exchange",
    description: "Complete your first Skill Hour exchange.",
    category: "Getting Started",
    tier: "none",
    iconName: "handshake"
  },

  // Collaboration
  collaborator: {
    id: "collaborator",
    title: "Collaborator",
    description: "Complete 5 exchanges.",
    category: "Collaboration",
    tier: "bronze",
    iconName: "medal"
  },
  power_collaborator: {
    id: "power_collaborator",
    title: "Power Collaborator",
    description: "Complete 25 exchanges.",
    category: "Collaboration",
    tier: "silver",
    iconName: "medal"
  },
  exchange_expert: {
    id: "exchange_expert",
    title: "Exchange Expert",
    description: "Complete 50 exchanges.",
    category: "Collaboration",
    tier: "gold",
    iconName: "medal"
  },
  exchange_master: {
    id: "exchange_master",
    title: "Exchange Master",
    description: "Complete 100 exchanges.",
    category: "Collaboration",
    tier: "platinum",
    iconName: "crown"
  },

  // Reputation & Trust
  top_rated: {
    id: "top_rated",
    title: "Top Rated",
    description: "Maintain a 4.8+ average rating after at least 20 reviews.",
    category: "Reputation",
    tier: "gold",
    iconName: "star"
  },
  trusted_member: {
    id: "trusted_member",
    title: "Trusted Member",
    description: "Maintain a Trust Score of 90+ for 90 consecutive days.",
    category: "Reputation",
    tier: "silver",
    iconName: "shield"
  },
  fast_responder: {
    id: "fast_responder",
    title: "Fast Responder",
    description: "Average first response time under 2 hours.",
    category: "Reputation",
    tier: "none",
    iconName: "zap"
  },
  dispute_free: {
    id: "dispute_free",
    title: "Dispute Free",
    description: "Complete 100 exchanges without a dispute.",
    category: "Reputation",
    tier: "platinum",
    iconName: "bird" // Lucide doesn't have dove, Bird is good
  },

  // Skill Hour Economy
  hour_earner: {
    id: "hour_earner",
    title: "Hour Earner",
    description: "Earn 50 Skill Hours.",
    category: "Economy",
    tier: "bronze",
    iconName: "clock"
  },
  time_investor: {
    id: "time_investor",
    title: "Time Investor",
    description: "Earn 250 Skill Hours.",
    category: "Economy",
    tier: "silver",
    iconName: "hourglass"
  },
  balanced_contributor: {
    id: "balanced_contributor",
    title: "Balanced",
    description: "Earn and spend at least 100 Skill Hours each.",
    category: "Economy",
    tier: "gold",
    iconName: "scale"
  },

  // Skills & Expertise
  multi_talented: {
    id: "multi_talented",
    title: "Multi-Talented",
    description: "Offer at least 5 verified skills.",
    category: "Expertise",
    tier: "silver",
    iconName: "palette"
  },
  specialist: {
    id: "specialist",
    title: "Specialist",
    description: "Complete 50 exchanges in one skill.",
    category: "Expertise",
    tier: "gold",
    iconName: "puzzle"
  },

  // Community & Verification
  verified: {
    id: "verified",
    title: "Verified",
    description: "Complete identity verification.",
    category: "Community",
    tier: "none",
    iconName: "badge-check"
  },
  helpful_member: {
    id: "helpful_member",
    title: "Helpful",
    description: "Receive 25 'Helpful' votes.",
    category: "Community",
    tier: "bronze",
    iconName: "heart-handshake"
  },
  ambassador: {
    id: "ambassador",
    title: "Ambassador",
    description: "Invite 10 approved members.",
    category: "Community",
    tier: "gold",
    iconName: "megaphone"
  },
  six_month_member: {
    id: "six_month_member",
    title: "6 Months",
    description: "Active for 6 months.",
    category: "Community",
    tier: "none",
    iconName: "calendar-days"
  },
  one_year_member: {
    id: "one_year_member",
    title: "1 Year",
    description: "Active for 1 year.",
    category: "Community",
    tier: "bronze",
    iconName: "cake"
  }
};

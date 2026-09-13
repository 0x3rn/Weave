import { MarketplaceRequest } from "@/types";

export const USE_DEMO_MARKETPLACE = true;

const now = Date.now();
const H = 3600000;
const D = 86400000;

function req(partial: any): MarketplaceRequest {
  return {
    requesterAvatar: "",
    requesterVerification: false,
    isMutual: false,
    deliverables: [],
    offeredSkills: [],
    offeredDeliverables: [],
    offeredHours: "",
    attachments: [],
    status: "open",
    preferredTimeZone: "Any",
    updatedAt: partial.createdAt,
    ...partial,
  };
}

export const DEMO_REQUESTS: MarketplaceRequest[] = [
  req({
    id: "demo-req-fullstack",
    title: "Full-Stack Web App for Task Management: React + Firebase",
    requesterId: "demo-user-sarah",
    requesterName: "Sarah Mitchell",
    requesterAvatar: "https://i.pravatar.cc/150?img=47",
    requesterTrustScore: 94,
    requesterVerification: true,
    description: "Build a collaborative task management web app. Wireframes and data model are ready.",
    deliverables: ["Deployed web app", "Admin dashboard", "API documentation"],
    category: "Development",
    skillsRequired: ["React", "Next.js", "Firebase", "TypeScript"],
    estimatedHours: "20-30 Hours",
    isMutual: true,
    offeredSkills: ["UI Design", "Logo Design"],
    offeredDeliverables: ["Complete brand kit", "UI component library"],
    offeredHours: "15-20 Hours",
    exchangeType: "Ongoing",
    timeline: "Within 1 month",
    preferredExperience: "Advanced",
    applicantsCount: 12,
    createdAt: new Date(now - 2 * H).toISOString(),
  }),
  req({
    id: "demo-req-brand",
    title: "Brand Identity Overhaul for B2B SaaS Startup",
    requesterId: "demo-user-james",
    requesterName: "James Rodriguez",
    requesterAvatar: "https://i.pravatar.cc/150?img=12",
    requesterTrustScore: 91,
    requesterVerification: true,
    description: "Complete brand identity overhaul before our public launch.",
    deliverables: ["Logo suite", "Color & typography system"],
    category: "Design",
    skillsRequired: ["Brand Identity", "Logo Design", "Figma"],
    estimatedHours: "15-20 Hours",
    exchangeType: "One-time",
    timeline: "Within 3 weeks",
    preferredExperience: "Advanced",
    applicantsCount: 8,
    createdAt: new Date(now - 5 * H).toISOString(),
  }),
  req({
    id: "demo-req-seo",
    title: "SEO Audit & Content Strategy for Dev-Tools Blog",
    requesterId: "demo-user-emily",
    requesterName: "Emily Chen",
    requesterAvatar: "https://i.pravatar.cc/150?img=44",
    requesterTrustScore: 88,
    requesterVerification: false,
    description: "Audit our content, identify keyword clusters, and build a 90-day content calendar.",
    deliverables: ["Technical SEO audit", "Keyword research report"],
    category: "Marketing",
    skillsRequired: ["SEO", "Content Strategy", "Analytics"],
    estimatedHours: "10-15 Hours",
    isMutual: true,
    offeredSkills: ["Data Analysis", "Google Analytics"],
    offeredDeliverables: ["Conversion funnel audit"],
    offeredHours: "10 Hours",
    exchangeType: "Ongoing",
    timeline: "Within 2 weeks",
    preferredExperience: "Intermediate",
    applicantsCount: 5,
    createdAt: new Date(now - 8 * H).toISOString(),
  }),
  req({
    id: "demo-req-ai",
    title: "Fine-Tune an LLM for Customer Support Automation",
    requesterId: "demo-user-aisha",
    requesterName: "Aisha Abdullah",
    requesterAvatar: "https://i.pravatar.cc/150?img=25",
    requesterTrustScore: 93,
    requesterVerification: true,
    description: "Automate the first response tier for 2,000+ monthly support tickets.",
    deliverables: ["Fine-tuned model", "Inference API"],
    category: "AI",
    skillsRequired: ["Machine Learning", "Python", "LLMs"],
    estimatedHours: "30-40 Hours",
    exchangeType: "One-time",
    timeline: "Within 6 weeks",
    preferredExperience: "Advanced",
    applicantsCount: 15,
    createdAt: new Date(now - 1 * H).toISOString(),
  }),
  req({
    id: "demo-req-mobile",
    title: "Mobile App with Offline-First Sync (React Native)",
    requesterId: "demo-user-grace",
    requesterName: "Grace Adeyemi",
    requesterAvatar: "https://i.pravatar.cc/150?img=26",
    requesterTrustScore: 90,
    requesterVerification: true,
    description: "Offline-first React Native app for field teams with photo attachments and sync.",
    deliverables: ["React Native app (iOS + Android)", "Offline sync layer"],
    category: "Development",
    skillsRequired: ["React Native", "TypeScript", "Offline Sync"],
    estimatedHours: "40+ Hours",
    exchangeType: "One-time",
    timeline: "Within 2 months",
    preferredExperience: "Advanced",
    applicantsCount: 18,
    createdAt: new Date(now - 30 * H).toISOString(),
  }),
  req({
    id: "demo-req-video",
    title: "Explainer Video Script, Storyboard & Production",
    requesterId: "demo-user-priya",
    requesterName: "Priya Patel",
    requesterAvatar: "https://i.pravatar.cc/150?img=32",
    requesterTrustScore: 96,
    requesterVerification: true,
    description: "90-second explainer video for our landing page and YouTube.",
    deliverables: ["90-sec animated explainer", "Storyboard deck"],
    category: "Video",
    skillsRequired: ["Video Editing", "Motion Graphics", "After Effects"],
    estimatedHours: "25-35 Hours",
    isMutual: true,
    offeredSkills: ["Product Strategy", "Copywriting"],
    offeredDeliverables: ["Positioning doc", "Landing page copy"],
    offeredHours: "10 Hours",
    exchangeType: "One-time",
    timeline: "Within 4 weeks",
    preferredExperience: "Advanced",
    applicantsCount: 6,
    createdAt: new Date(now - 3 * H).toISOString(),
  }),
  req({
    id: "demo-req-product",
    title: "MVP Feature Prioritization & Product Roadmap",
    requesterId: "demo-user-marcus",
    requesterName: "Marcus Johnson",
    requesterAvatar: "https://i.pravatar.cc/150?img=59",
    requesterTrustScore: 78,
    requesterVerification: false,
    description: "Help synthesize beta user feedback and build a 6-month roadmap.",
    deliverables: ["Prioritization framework", "6-month roadmap"],
    category: "Product",
    skillsRequired: ["Product Strategy", "User Research"],
    estimatedHours: "5-8 Hours",
    exchangeType: "One-time",
    timeline: "Within 2 weeks",
    preferredExperience: "Intermediate",
    applicantsCount: 4,
    createdAt: new Date(now - 2 * D).toISOString(),
  }),
  req({
    id: "demo-req-financial",
    title: "Financial Model for B2B SaaS Pricing & Forecasting",
    requesterId: "demo-user-laura",
    requesterName: "Laura García",
    requesterAvatar: "https://i.pravatar.cc/150?img=41",
    requesterTrustScore: 89,
    requesterVerification: true,
    description: "Financial model to support our Series A fundraising.",
    deliverables: ["Unit economics model", "24-month forecast"],
    category: "Business",
    skillsRequired: ["Financial Modeling", "Excel", "SaaS Metrics"],
    estimatedHours: "15-20 Hours",
    exchangeType: "One-time",
    timeline: "Within 3 weeks",
    preferredExperience: "Advanced",
    applicantsCount: 7,
    createdAt: new Date(now - 12 * H).toISOString(),
  }),
  req({
    id: "demo-req-dashboard",
    title: "Interactive Analytics Dashboard with React & D3",
    requesterId: "demo-user-tomas",
    requesterName: "Tomás Silva",
    requesterAvatar: "https://i.pravatar.cc/150?img=11",
    requesterTrustScore: 85,
    requesterVerification: false,
    description: "Real-time analytics dashboard with interactive charts for campaign performance.",
    deliverables: ["Interactive dashboard", "Reusable chart components"],
    category: "Data",
    skillsRequired: ["React", "D3.js", "TypeScript"],
    estimatedHours: "20-25 Hours",
    isMutual: true,
    offeredSkills: ["SQL", "Python"],
    offeredDeliverables: ["Data pipeline scripts"],
    offeredHours: "10-12 Hours",
    exchangeType: "Ongoing",
    timeline: "Within 1 month",
    preferredExperience: "Advanced",
    applicantsCount: 10,
    createdAt: new Date(now - 6 * H).toISOString(),
  }),
  req({
    id: "demo-req-pm",
    title: "Part-Time Project Manager for Design Agency Workflow",
    requesterId: "demo-user-ben",
    requesterName: "Ben Carter",
    requesterAvatar: "https://i.pravatar.cc/150?img=53",
    requesterTrustScore: 75,
    requesterVerification: false,
    description: "Help implement a simple project management workflow for a 3-person design agency.",
    deliverables: ["Project management setup", "Weekly status tracking"],
    category: "Other",
    skillsRequired: ["Project Management", "Notion"],
    estimatedHours: "5-7 Hours",
    exchangeType: "Ongoing",
    timeline: "Flexible",
    preferredExperience: "Any",
    applicantsCount: 3,
    createdAt: new Date(now - 3 * D).toISOString(),
  }),
  req({
    id: "demo-req-copy",
    title: "Landing Page & Email Sequence for Product Launch",
    requesterId: "demo-user-hana",
    requesterName: "Hana Suzuki",
    requesterAvatar: "https://i.pravatar.cc/150?img=20",
    requesterTrustScore: 84,
    requesterVerification: false,
    description: "Conversion-focused copywriter for landing page, pricing, and onboarding emails.",
    deliverables: ["Landing page copy", "5-email onboarding sequence"],
    category: "Writing",
    skillsRequired: ["Copywriting", "Conversion Optimization"],
    estimatedHours: "10-12 Hours",
    exchangeType: "One-time",
    timeline: "Within 2 weeks",
    preferredExperience: "Intermediate",
    applicantsCount: 11,
    createdAt: new Date(now - 2 * H).toISOString(),
  }),
  req({
    id: "demo-req-tech-writing",
    title: "Technical Blog Posts for a Developer Platform",
    requesterId: "demo-user-daniel",
    requesterName: "Daniel Kim",
    requesterAvatar: "https://i.pravatar.cc/150?img=68",
    requesterTrustScore: 82,
    requesterVerification: false,
    description: "Six in-depth technical blog posts covering API design, CI/CD, and developer experience.",
    deliverables: ["6 technical articles", "Code snippets & examples"],
    category: "Writing",
    skillsRequired: ["Technical Writing", "JavaScript"],
    estimatedHours: "Find out",
    exchangeType: "One-time",
    timeline: "Within 2 months",
    preferredExperience: "Intermediate",
    applicantsCount: 9,
    createdAt: new Date(now - 1 * D).toISOString(),
  }),
];

export const DEMO_PROFESSIONALS = [
  {
    id: "demo-pro-olivia", username: "oliviabennett", name: "Olivia Bennett",
    avatar: "https://i.pravatar.cc/150?img=1",
    headline: "Senior Product Designer | Design systems & UX strategy",
    isVerified: true, trustScore: 96, rating: 4.9, completedExchanges: 47,
    topSkills: ["UI Design", "Figma", "Prototyping"], availability: "20-30 hours/week",
  },
  {
    id: "demo-pro-ethan", username: "ethanwalker", name: "Ethan Walker",
    avatar: "https://i.pravatar.cc/150?img=3",
    headline: "Full-Stack Developer | React, Next.js & Firebase",
    isVerified: false, trustScore: 92, rating: 4.8, completedExchanges: 63,
    topSkills: ["React", "Next.js", "Firebase"], availability: "Full-time",
  },
  {
    id: "demo-pro-maya", username: "mayapatel", name: "Maya Patel",
    avatar: "https://i.pravatar.cc/150?img=2",
    headline: "Content Strategist & SEO Copywriter",
    isVerified: true, trustScore: 90, rating: 4.7, completedExchanges: 38,
    topSkills: ["Copywriting", "SEO", "Content Strategy"], availability: "10-15 hours/week",
  },
  {
    id: "demo-pro-noah", username: "noahthompson", name: "Noah Thompson",
    avatar: "https://i.pravatar.cc/150?img=4",
    headline: "Video Editor & Motion Graphics Artist",
    isVerified: false, trustScore: 87, rating: 4.6, completedExchanges: 29,
    topSkills: ["Video Editing", "Motion Graphics"], availability: "20 hours/week",
  },
  {
    id: "demo-pro-sofia", username: "sofiarossi", name: "Sofia Rossi",
    avatar: "https://i.pravatar.cc/150?img=5",
    headline: "Brand Designer | Logos, identity systems & guidelines",
    isVerified: true, trustScore: 94, rating: 5.0, completedExchanges: 52,
    topSkills: ["Logo Design", "Brand Identity", "Typography"], availability: "Flexible",
  },
  {
    id: "demo-pro-lucas", username: "lucasmeyer", name: "Lucas Meyer",
    avatar: "https://i.pravatar.cc/150?img=6",
    headline: "Data Analyst | Python, SQL & visualization",
    isVerified: false, trustScore: 85, rating: 4.5, completedExchanges: 31,
    topSkills: ["Python", "SQL", "Data Visualization"], availability: "15-20 hours/week",
  },
  {
    id: "demo-pro-amara", username: "amaraokafor", name: "Amara Okafor",
    avatar: "https://i.pravatar.cc/150?img=7",
    headline: "AI Engineer | LLMs, RAG & production ML",
    isVerified: true, trustScore: 95, rating: 4.9, completedExchanges: 41,
    topSkills: ["Machine Learning", "LLMs", "Python"], availability: "Full-time",
  },
  {
    id: "demo-pro-jack", username: "jackwilson", name: "Jack Wilson",
    avatar: "https://i.pravatar.cc/150?img=8",
    headline: "Marketing Specialist | Growth & email campaigns",
    isVerified: false, trustScore: 81, rating: 4.4, completedExchanges: 22,
    topSkills: ["Social Media", "Email Marketing"], availability: "10 hours/week",
  },
];

export const DEMO_SAVED_ITEMS = [
  { id: "demo-req-fullstack", type: "request" },
  { id: "demo-req-ai", type: "request" },
  { id: "demo-pro-olivia", type: "professional" },
  { id: "demo-pro-amara", type: "professional" },
];

export const DEMO_APPLIED_REQUEST_IDS = ["demo-req-brand", "demo-req-seo"];

export function getDemoMarketplaceData(filters: any = {}, searchQuery = "") {
  let requests = [...DEMO_REQUESTS].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  let professionals = [...DEMO_PROFESSIONALS];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    requests = requests.filter((r) =>
      [r.title, r.description, r.category, r.requesterName, ...(r.skillsRequired || [])]
        .join(" ").toLowerCase().includes(q)
    );
    professionals = professionals.filter((p) =>
      [p.name, p.headline, p.username, ...(p.topSkills || [])]
        .join(" ").toLowerCase().includes(q)
    );
  }

  if (filters.category?.length) requests = requests.filter((r) => filters.category.includes(r.category));
  if (filters.exchangeType === "Mutual") requests = requests.filter((r) => !!r.isMutual);
  if (filters.exchangeType === "Standard") requests = requests.filter((r) => !r.isMutual);
  if (filters.verifiedOnly) requests = requests.filter((r) => r.requesterVerification === true);
  if (filters.minTrustScore) {
    requests = requests.filter((r) => r.requesterTrustScore >= filters.minTrustScore);
    professionals = professionals.filter((p) => p.trustScore >= filters.minTrustScore);
  }
  if (filters.minRating && filters.minRating !== "Any" && filters.minRating !== "") {
    const minR = parseFloat(filters.minRating);
    professionals = professionals.filter((p) => p.rating >= minR);
  }

  return {
    success: true,
    requests,
    professionals,
    stats: {
      openRequests: requests.length,
      professionalsAvailable: professionals.length,
      newToday: requests.filter((r) => new Date(r.createdAt).getTime() > Date.now() - D).length,
      recommendedMatches: Math.min(12, requests.length),
    },
  };
}

export function getDemoMarketplaceRequest(id: string) {
  const request = DEMO_REQUESTS.find((r) => r.id === id);
  if (!request) return { success: false as const, error: "Request not found" };
  return { success: true as const, request };
}

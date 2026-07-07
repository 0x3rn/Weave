import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Ensure you run this with the correct service account or emulator
// Example: npx tsx scripts/seed-marketplace.ts

if (!getApps().length) {
  // Application default credentials are used if cert is omitted
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-weave'
  });
}

const db = getFirestore();

const CATEGORIES = ["Development", "Design", "Marketing", "Writing", "Video", "Product", "Business", "Data", "AI", "Other"];
const SKILLS = ["React", "Logo Design", "Copywriting", "Mobile App", "Brand Identity", "Next.js", "Firebase", "SEO", "UI Design", "Figma"];

async function seed() {
  console.log("Seeding marketplace data...");
  
  // Create 20 mock requests
  for (let i = 0; i < 20; i++) {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const req = {
      title: `Need help with ${category} project ${i+1}`,
      requesterId: `mock-user-${Math.floor(Math.random() * 5)}`,
      requesterName: `Alice ${Math.floor(Math.random() * 100)}`,
      requesterTrustScore: 80 + Math.floor(Math.random() * 20),
      requesterVerification: Math.random() > 0.3,
      description: `Looking for someone to help with ${category} tasks. Wireframes/details are already available.`,
      deliverables: ["Responsive design", "Source files"],
      category,
      skillsRequired: [SKILLS[Math.floor(Math.random() * SKILLS.length)], SKILLS[Math.floor(Math.random() * SKILLS.length)]],
      estimatedHours: Math.random() > 0.5 ? "5-7 Hours" : "10+",
      exchangeType: Math.random() > 0.5 ? "One-time" : "Ongoing",
      timeline: "Within 2 weeks",
      preferredExperience: "Intermediate",
      status: "open",
      applicantsCount: Math.floor(Math.random() * 15),
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.collection("marketplace_requests").add(req);
    console.log(`Created request ${i+1}`);
  }
  
  console.log("Seeding complete!");
}

seed().catch(console.error);

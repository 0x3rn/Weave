import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-weave'
  });
}

const db = getFirestore();

async function run() {
  const users = await db.collection('users').get();
  for (const doc of users.docs) {
    const portfolio = await db.collection('users').doc(doc.id).collection('portfolio').limit(1).get();
    if (!portfolio.empty) {
      await db.collection('users').doc(doc.id).update({ hasPortfolio: true });
      console.log(`Updated ${doc.id}`);
    }
  }
  console.log("Done!");
}

run().catch(console.error);

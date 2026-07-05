import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";

async function main() {
  if (getApps().length === 0) {
    const serviceAccountPath = path.join(process.cwd(), "google-services.json");
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      console.log("No service account found, using default");
      initializeApp();
    }
  }

  const db = getFirestore();
  const usersRef = db.collection("users");
  const snapshot = await usersRef.get();
  
  if (snapshot.empty) {
    console.log("No users found.");
    return;
  }
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      achievements: {
        welcome_aboard: true,
        profile_complete: true,
        first_match: true,
        collaborator: true,
        trusted_member: true,
        verified: true,
      }
    });
    console.log(`Prepared update for user ${doc.id}`);
  });
  
  await batch.commit();
  console.log("Successfully awarded mock achievements to all users.");
}

main().catch(console.error);

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const firestore = getFirestore();
const storage = getStorage();
const sql = neon(process.env.DATABASE_URL);

async function firestoreCount(collection) {
  const count = await firestore.collection(collection).count().get();
  return count.data().count;
}

async function neonCount(query) {
  const [result] = await sql.query(query);
  return Number(result.count);
}

async function nestedCounts() {
  const userSnapshot = await firestore.collection("users").get();
  const exchangeSnapshot = await firestore.collection("exchanges").get();
  let portfolio = 0;
  let devices = 0;
  let saved = 0;
  let nestedNotifications = 0;
  let deliveries = 0;
  let activity = 0;
  let exchangeMessages = 0;
  for (const user of userSnapshot.docs) {
    const [portfolioSnapshot, devicesSnapshot, savedSnapshot, notificationsSnapshot] = await Promise.all([
      user.ref.collection("portfolio").count().get(), user.ref.collection("devices").count().get(), user.ref.collection("saved").count().get(), user.ref.collection("notifications").count().get(),
    ]);
    portfolio += portfolioSnapshot.data().count;
    devices += devicesSnapshot.data().count;
    saved += savedSnapshot.data().count;
    nestedNotifications += notificationsSnapshot.data().count;
  }
  for (const exchange of exchangeSnapshot.docs) {
    const [deliveriesSnapshot, activitySnapshot, messagesSnapshot] = await Promise.all([
      exchange.ref.collection("deliveries").count().get(), exchange.ref.collection("activity").count().get(), exchange.ref.collection("messages").count().get(),
    ]);
    deliveries += deliveriesSnapshot.data().count;
    activity += activitySnapshot.data().count;
    exchangeMessages += messagesSnapshot.data().count;
  }
  return { portfolio, devices, saved, nestedNotifications, deliveries, activity, exchangeMessages };
}

const nested = await nestedCounts();
const [files] = await storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET).getFiles({ autoPaginate: true });
const expected = {
  users: await firestoreCount("users"),
  invite_applications: await firestoreCount("invite_applications"),
  invites: await firestoreCount("invites"),
  marketplace_requests: await firestoreCount("marketplace_requests"),
  marketplace_applications: await firestoreCount("marketplace_applications"),
  exchange_requests: await firestoreCount("exchange_requests"),
  exchanges: await firestoreCount("exchanges"),
  escrows: await firestoreCount("escrows"),
  ledger_entries: (await firestoreCount("transactions")) + (await firestoreCount("skill_ledger")),
  conversations: await firestoreCount("conversations"),
  messages: (await firestoreCount("messages")) + nested.exchangeMessages,
  reviews: await firestoreCount("reviews"),
  notifications: (await firestoreCount("notifications")) + nested.nestedNotifications,
  portfolio_items: nested.portfolio,
  user_devices: nested.devices,
  saved_items: nested.saved,
  exchange_deliveries: nested.deliveries,
  exchange_activity: nested.activity,
  firebase_storage_objects: files.length,
};

const actual = {
  users: await neonCount("select count(*) from users where not (payload ? 'migratedPlaceholder')"),
  invite_applications: await neonCount("select count(*) from invite_applications"),
  invites: await neonCount("select count(*) from invites"),
  marketplace_requests: await neonCount("select count(*) from marketplace_requests"),
  marketplace_applications: await neonCount("select count(*) from marketplace_applications"),
  exchange_requests: await neonCount("select count(*) from exchange_requests"),
  exchanges: await neonCount("select count(*) from exchanges"),
  escrows: await neonCount("select count(*) from escrows"),
  ledger_entries: await neonCount("select count(*) from ledger_entries"),
  conversations: await neonCount("select count(*) from conversations"),
  messages: await neonCount("select count(*) from messages"),
  reviews: await neonCount("select count(*) from reviews"),
  notifications: await neonCount("select count(*) from notifications"),
  portfolio_items: await neonCount("select count(*) from portfolio_items"),
  user_devices: await neonCount("select count(*) from user_devices"),
  saved_items: await neonCount("select count(*) from saved_items"),
  exchange_deliveries: await neonCount("select count(*) from exchange_deliveries"),
  exchange_activity: await neonCount("select count(*) from exchange_activity"),
  firebase_storage_objects: await neonCount("select count(*) from firebase_storage_objects"),
};

const rows = Object.keys(expected).map(table => ({ table, firestore: expected[table], neon: actual[table], matches: expected[table] === actual[table] }));
console.table(rows);
if (rows.some(row => !row.matches)) process.exitCode = 1;

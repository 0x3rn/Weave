import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const sql = neon(process.env.DATABASE_URL);
const [object] = await sql.query("select target_key from firebase_storage_objects where target_bucket=$1 and migrated_at is not null order by target_key limit 1", [process.env.NEON_STORAGE_PUBLIC_BUCKET]);
if (!object) throw new Error("No migrated public object is available for route verification.");
const path = String(object.target_key).split("/").map(encodeURIComponent).join("/");
const response = await fetch(`http://127.0.0.1:3000/api/storage/public/${path}`);
if (!response.ok) throw new Error(`Public storage route returned ${response.status}`);
const bytes = new Uint8Array(await response.arrayBuffer());
if (!bytes.length) throw new Error("Public storage route returned an empty object");
console.log(JSON.stringify({ status: response.status, contentType: response.headers.get("content-type"), bytesReceived: bytes.length > 0 }));

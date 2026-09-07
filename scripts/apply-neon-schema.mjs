import { readdir, readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const sql = neon(process.env.DATABASE_URL);
const migrationDirectory = "database/migrations";
const migrationFiles = (await readdir(migrationDirectory)).filter(file => file.endsWith(".sql")).sort();
const statements = (await Promise.all(migrationFiles.map(file => readFile(`${migrationDirectory}/${file}`, "utf8"))))
  .flatMap(migration => migration.replace(/^--.*$/gm, "").split(";"))
  .map(statement => statement.trim())
  .filter(Boolean);

await sql.transaction(statements.map(statement => sql.query(statement)));
const tables = await sql.query("select tablename from pg_tables where schemaname = 'public' order by tablename");
console.log(`Applied ${statements.length} schema statements.`);
console.table(tables);

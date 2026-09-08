import { readdir, readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const sql = neon(process.env.DATABASE_URL);
const migrationDirectory = "database/migrations";
const migrationFiles = (await readdir(migrationDirectory)).filter(file => file.endsWith(".sql")).sort();

function splitStatements(source) {
  const statements = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inDollarQuote = false;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    const next = source[index + 1];
    if (!inSingleQuote && !inDoubleQuote && char === "$" && next === "$") {
      inDollarQuote = !inDollarQuote;
      current += "$$";
      index++;
      continue;
    }
    if (!inDollarQuote && !inDoubleQuote && char === "'") {
      current += char;
      if (inSingleQuote && next === "'") {
        current += next;
        index++;
      } else {
        inSingleQuote = !inSingleQuote;
      }
      continue;
    }
    if (!inDollarQuote && !inSingleQuote && char === '"') inDoubleQuote = !inDoubleQuote;
    if (char === ";" && !inSingleQuote && !inDoubleQuote && !inDollarQuote) {
      if (current.trim()) statements.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

const statements = (await Promise.all(migrationFiles.map(file => readFile(`${migrationDirectory}/${file}`, "utf8"))))
  .flatMap(migration => splitStatements(migration.replace(/^--.*$/gm, "")))
  .map(statement => statement.trim())
  .filter(Boolean);

await sql.transaction(statements.map(statement => sql.query(statement)));
const tables = await sql.query("select tablename from pg_tables where schemaname = 'public' order by tablename");
console.log(`Applied ${statements.length} schema statements.`);
console.table(tables);

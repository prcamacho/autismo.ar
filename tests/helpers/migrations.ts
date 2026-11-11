import { readFile, readdir } from "node:fs/promises";
import type { PGlite } from "@electric-sql/pglite";

export async function applyMigrations(db: PGlite) {
  const directory = new URL("../../supabase/migrations/", import.meta.url);
  for (const name of (await readdir(directory))
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    await db.exec(await readFile(new URL(name, directory), "utf8"));
  }
}

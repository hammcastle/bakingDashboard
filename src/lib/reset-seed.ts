import fs from "node:fs";
import { closeDb, dbPath, getDb } from "./db";

const file = dbPath();
closeDb();
for (const suffix of ["", "-wal", "-shm"]) {
  const target = `${file}${suffix}`;
  if (fs.existsSync(target)) fs.unlinkSync(target);
}
process.env.BAKERY_SKIP_SEED = "0";
getDb();
closeDb();
console.log(`Seeded ${file}`);

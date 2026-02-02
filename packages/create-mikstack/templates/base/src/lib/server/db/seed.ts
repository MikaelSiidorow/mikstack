/**
 * Database seed script.
 *
 * Run with: {{pmRun}} db:seed
 */

// import { db } from './index';

// eslint-disable-next-line @typescript-eslint/require-await
async function seed() {
  console.log("Seeding database...");

  // Add your seed data here

  console.log("Seeding complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

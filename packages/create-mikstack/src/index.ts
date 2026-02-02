import { cli } from "./cli.ts";

cli().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.js",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./sqlite.db",
  },
});

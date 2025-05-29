import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { database } from "./config";

const dialect = new LibsqlDialect({
  url: database.url,
  authToken: database.token,
});

export const auth = betterAuth({
  database: {
    dialect,
    type: "sqlite",
  },
  emailAndPassword: {
    enabled: true,
  },
});

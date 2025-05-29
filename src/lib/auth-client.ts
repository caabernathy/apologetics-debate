import { createAuthClient } from "better-auth/react";
import { betterAuthUrl } from "./config";

export const authClient = createAuthClient({
  baseURL: betterAuthUrl,
});

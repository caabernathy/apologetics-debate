import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";

export const ALL: APIRoute = async ({ request, clientAddress }) => {
  // Optional: rate limiting
  // request.headers.set("x-forwarded-for", clientAddress);
  return auth.handler(request);
};

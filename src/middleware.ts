import { defineMiddleware } from "astro:middleware";
import { auth } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const result = await auth.api.getSession({
    headers: context.request.headers,
  });
  context.locals.session = result?.session ?? null;
  context.locals.user = result?.user ?? null;

  return next();
});

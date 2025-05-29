import type { APIRoute } from "astro";
import { GeminiService } from "../../lib/apis/gemini";
import { db, generateId } from "../../lib/db/client";
import { debateSessions, debateMessages } from "../../lib/db/schema";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userId, topic, isUserApologist } = await request.json();

    if (!userId || !topic) {
      return new Response(
        JSON.stringify({ error: "User ID and topic are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create new debate session
    const savedDebate = await db
      .insert(debateSessions)
      .values({
        id: generateId("debate"),
        userId,
        topic,
        isUserApologist: Boolean(isUserApologist),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const debate = savedDebate[0];

    return new Response(
      JSON.stringify({
        debate,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error starting debate:", error);

    let errorMessage = "Failed to start debate";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "API configuration error";
        statusCode = 503;
      } else if (error.message.includes("rate limit")) {
        errorMessage = "Rate limit exceeded. Please try again later.";
        statusCode = 429;
      } else if (error.message.includes("UNIQUE constraint")) {
        errorMessage = "Debate session already exists";
        statusCode = 409;
      } else if (error.message.includes("NOT NULL constraint")) {
        errorMessage = "Missing required fields";
        statusCode = 400;
      }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
};

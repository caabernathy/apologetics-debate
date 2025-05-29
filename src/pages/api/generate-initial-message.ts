import type { APIRoute } from "astro";
import { GeminiService } from "../../lib/apis/gemini";
import { db, generateId } from "../../lib/db/client";
import { debateMessages } from "../../lib/db/schema";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { sessionId, topic } = await request.json();

    if (!sessionId || !topic) {
      return new Response(
        JSON.stringify({ error: "Session ID and topic are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Generate initial skeptical question using Gemini
    const initialQuestion = await GeminiService.generateTopicIntroduction(topic);

    // Save the AI message to database
    const savedMessage = await db
      .insert(debateMessages)
      .values({
        id: generateId("msg"),
        sessionId,
        content: initialQuestion,
        senderType: "AI",
        createdAt: new Date().toISOString(),
      })
      .returning();

    return new Response(JSON.stringify(savedMessage[0]), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating initial message:", error);

    let errorMessage = "Failed to generate initial message";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "API configuration error";
        statusCode = 503;
      } else if (error.message.includes("rate limit")) {
        errorMessage = "Rate limit exceeded. Please try again later.";
        statusCode = 429;
      }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
};
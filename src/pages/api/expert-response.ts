import type { APIRoute } from "astro";
import { ApologistProjectService } from "../../lib/apis/apologist-project";
import { db } from "../../lib/db/client";
import { debateMessages } from "../../lib/db/schema";
import { eq } from "drizzle-orm";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { sessionId, skepticalQuestion, userAttempt, topic } =
      await request.json();

    if (!sessionId || !skepticalQuestion) {
      return new Response(
        JSON.stringify({
          error: "Session ID and skeptical question are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Get conversation history for context
    const history = await db
      .select()
      .from(debateMessages)
      .where(eq(debateMessages.sessionId, sessionId))
      .orderBy(debateMessages.createdAt);

    // Generate expert response
    const expertResponse = await ApologistProjectService.generateExpertResponse(
      skepticalQuestion,
      userAttempt || "No user attempt provided",
      history,
      topic,
    );

    // Return expert response without saving to database
    return new Response(
      JSON.stringify({
        content: expertResponse,
        senderType: "EXPERT",
        sessionId,
        isExpertResponse: true,
        skepticalQuestion,
        userAttempt: userAttempt || null,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error generating expert response:", error);

    let errorMessage = "Failed to generate expert response";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "API configuration error";
        statusCode = 503;
      } else if (error.message.includes("rate limit")) {
        errorMessage = "Rate limit exceeded. Please try again later.";
        statusCode = 429;
      } else if (error.message.includes("quota")) {
        errorMessage = "API quota exceeded. Please try again later.";
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
};

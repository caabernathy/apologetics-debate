import type { APIRoute } from "astro";
import { ApologistProjectService } from "../../lib/apis/apologist-project";
import { GeminiService } from "../../lib/apis/gemini";
import { db, generateId } from "../../lib/db/client";
import { debateMessages } from "../../lib/db/schema";
import { eq, asc } from "drizzle-orm";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { sessionId, userMessage, isUserApologist, topic, type } =
      await request.json();

    if (!sessionId || !topic) {
      return new Response(
        JSON.stringify({ error: "Session ID and topic are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Get conversation history from database
    const history = await db
      .select()
      .from(debateMessages)
      .where(eq(debateMessages.sessionId, sessionId))
      .orderBy(asc(debateMessages.createdAt));

    const conversationHistory = history;

    let aiResponse: string;
    let senderType: "AI" | "EXPERT";

    if (type === "expert-response") {
      // User is apologist requesting expert response
      if (!userMessage) {
        return new Response(
          JSON.stringify({
            error: "User message is required for expert response",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const lastAiMessage = history.findLast((msg) => msg.senderType === "AI");
      if (!lastAiMessage) {
        return new Response(
          JSON.stringify({ error: "No AI question found for expert response" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      aiResponse = await ApologistProjectService.generateExpertResponse(
        lastAiMessage.content,
        userMessage,
        conversationHistory,
        topic,
      );
      senderType = "EXPERT";
    } else if (isUserApologist) {
      // Generate skeptical question for apologist user
      if (conversationHistory.length === 0) {
        // First question - use topic introduction
        aiResponse = await GeminiService.generateTopicIntroduction(topic);
      } else if (userMessage) {
        // Follow-up question based on user's previous response
        // Note: GeminiService.generateFollowUpQuestion currently expects string[] history.
        // If needed, update GeminiService to accept DebateMessage[] or format here.
        const historyStrings = history.map((msg) => msg.content); // Format for Gemini if needed
        aiResponse = await GeminiService.generateFollowUpQuestion(
          historyStrings[historyStrings.length - 2] || "", // historyStrings is already string[]
          userMessage,
          topic,
        );
      } else {
        // General skeptical question
        const historyStrings = history.map((msg) => msg.content); // Format for Gemini if needed
        aiResponse = await GeminiService.generateSkepticalQuestion(
          topic,
          historyStrings,
          "intermediate",
        );
      }
      senderType = "AI";
    } else {
      // Generate apologetic response for skeptic user
      if (!userMessage) {
        return new Response(
          JSON.stringify({
            error: "User message is required for apologetic response",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      aiResponse = await ApologistProjectService.generateApologeticResponse(
        userMessage,
        conversationHistory,
        topic,
      );
      senderType = "AI";
    }

    // Save AI response to database (only if not expert response)
    if (type !== "expert-response") {
      const savedMessage = await db
        .insert(debateMessages)
        .values({
          id: generateId("msg"),
          sessionId,
          content: aiResponse,
          senderType,
          createdAt: new Date().toISOString(),
        })
        .returning();

      return new Response(JSON.stringify(savedMessage[0]), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // For expert responses, just return the content without saving
      return new Response(
        JSON.stringify({
          content: aiResponse,
          senderType,
          sessionId,
          isExpertResponse: true,
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("Error generating AI response:", error);

    let errorMessage = "Failed to generate AI response";
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

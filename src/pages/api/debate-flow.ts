import type { APIRoute } from "astro";
import { GeminiService } from "../../lib/apis/gemini";
import { ApologistProjectService } from "../../lib/apis/apologist-project";
import { db, generateId } from "../../lib/db/client";
import { debateMessages, debateSessions } from "../../lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";

export const prerender = false;

interface DebateFlowRequest {
  sessionId: string;
  action:
    | "user_message"
    | "get_next_question"
    | "get_expert_response"
    | "use_expert_response";
  content?: string;
  expertResponseId?: string;
}

interface DebateFlowResponse {
  success: boolean;
  nextAction:
    | "user_input"
    | "ai_response"
    | "expert_available"
    | "debate_complete";
  messages?: any[];
  expertResponse?: string;
  error?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { sessionId, action, content, expertResponseId }: DebateFlowRequest =
      await request.json();

    if (!sessionId || !action) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Session ID and action are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Get debate session info
    const session = await db
      .select()
      .from(debateSessions)
      .where(eq(debateSessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Debate session not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const debate = session[0];

    // Get conversation history
    const messages = await db
      .select()
      .from(debateMessages)
      .where(eq(debateMessages.sessionId, sessionId))
      .orderBy(asc(debateMessages.createdAt));

    const conversationHistory = messages.map((msg) => msg.content);

    let response: DebateFlowResponse = {
      success: true,
      nextAction: "user_input",
      messages,
    };

    switch (action) {
      case "user_message":
        if (!content) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Message content is required",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        // Save user message
        const userMessage = await db
          .insert(debateMessages)
          .values({
            id: generateId("msg"),
            sessionId,
            content,
            senderType: "USER",
            createdAt: new Date().toISOString(),
          })
          .returning();

        // Update debate session timestamp
        await db
          .update(debateSessions)
          .set({ updatedAt: new Date().toISOString() })
          .where(eq(debateSessions.id, sessionId));

        // Determine AI response based on user role
        let aiResponse: string;
        let aiSenderType: "AI" | "EXPERT" = "AI";

        if (debate.isUserApologist) {
          // User is apologist, generate next skeptical question
          if (conversationHistory.length <= 1) {
            aiResponse = await GeminiService.generateTopicIntroduction(
              debate.topic,
            );
          } else {
            const lastAiMessage = messages.findLast(
              (msg) => msg.senderType === "AI",
            );
            aiResponse = await GeminiService.generateFollowUpQuestion(
              lastAiMessage?.content || "",
              content,
              debate.topic,
            );
          }
        } else {
          // User is skeptic, generate apologetic response
          aiResponse = await ApologistProjectService.generateApologeticResponse(
            content,
            messages,
            debate.topic,
          );
        }

        // Save AI response
        const aiMessage = await db
          .insert(debateMessages)
          .values({
            id: generateId("msg"),
            sessionId,
            content: aiResponse,
            senderType: aiSenderType,
            createdAt: new Date().toISOString(),
          })
          .returning();

        // Get updated messages
        const updatedMessages = await db
          .select()
          .from(debateMessages)
          .where(eq(debateMessages.sessionId, sessionId))
          .orderBy(asc(debateMessages.createdAt));

        response = {
          success: true,
          nextAction: debate.isUserApologist
            ? "expert_available"
            : "user_input",
          messages: updatedMessages,
        };
        break;

      case "get_next_question":
        if (!debate.isUserApologist) {
          return new Response(
            JSON.stringify({
              success: false,
              error:
                "Next question generation only available for apologist mode",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const nextQuestion = await GeminiService.generateSkepticalQuestion(
          debate.topic,
          conversationHistory,
          "intermediate",
        );

        const questionMessage = await db
          .insert(debateMessages)
          .values({
            id: generateId("msg"),
            sessionId,
            content: nextQuestion,
            senderType: "AI",
            createdAt: new Date().toISOString(),
          })
          .returning();

        const questionsUpdated = await db
          .select()
          .from(debateMessages)
          .where(eq(debateMessages.sessionId, sessionId))
          .orderBy(asc(debateMessages.createdAt));

        response = {
          success: true,
          nextAction: "expert_available",
          messages: questionsUpdated,
        };
        break;

      case "get_expert_response":
        if (!debate.isUserApologist) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Expert responses only available for apologist mode",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const lastAiMessage = messages.findLast(
          (msg) => msg.senderType === "AI",
        );
        const lastUserMessage = messages.findLast(
          (msg) => msg.senderType === "USER",
        );

        if (!lastAiMessage) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "No AI question found for expert response",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const expertResponse =
          await ApologistProjectService.generateExpertResponse(
            lastAiMessage.content,
            lastUserMessage?.content || "No user attempt provided",
            messages,
            debate.topic,
          );

        response = {
          success: true,
          nextAction: "expert_available",
          messages,
          expertResponse,
        };
        break;

      case "use_expert_response":
        if (!debate.isUserApologist || !content) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Expert response content required for apologist mode",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        // Save expert response as user message
        const expertAsUserMessage = await db
          .insert(debateMessages)
          .values({
            id: generateId("msg"),
            sessionId,
            content,
            senderType: "USER",
            createdAt: new Date().toISOString(),
          })
          .returning();

        // Generate next skeptical question
        const followUpQuestion = await GeminiService.generateFollowUpQuestion(
          messages[messages.length - 2]?.content || "",
          content,
          debate.topic,
        );

        const followUpMessage = await db
          .insert(debateMessages)
          .values({
            id: generateId("msg"),
            sessionId,
            content: followUpQuestion,
            senderType: "AI",
            createdAt: new Date().toISOString(),
          })
          .returning();

        const expertUpdatedMessages = await db
          .select()
          .from(debateMessages)
          .where(eq(debateMessages.sessionId, sessionId))
          .orderBy(asc(debateMessages.createdAt));

        response = {
          success: true,
          nextAction: "expert_available",
          messages: expertUpdatedMessages,
        };
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid action" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
    }

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in debate flow:", error);

    let errorMessage = "Failed to process debate flow";
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

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: statusCode, headers: { "Content-Type": "application/json" } },
    );
  }
};

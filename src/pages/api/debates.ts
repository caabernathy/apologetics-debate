import type { APIRoute } from "astro";
import { db, generateId } from "../../lib/db/client";
import { debateSessions } from "../../lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Query the database for user's debates
    const debates = await db
      .select()
      .from(debateSessions)
      .where(eq(debateSessions.userId, userId))
      .orderBy(desc(debateSessions.updatedAt));

    return new Response(JSON.stringify(debates), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching debates:", error);

    let errorMessage = "Failed to fetch debates";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("no such table")) {
        errorMessage = "Database not initialized";
        statusCode = 503;
      } else if (error.message.includes("connection")) {
        errorMessage = "Database connection error";
        statusCode = 503;
      }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userId, topic, isUserApologist } = await request.json();

    if (!userId || !topic) {
      return new Response(
        JSON.stringify({ error: "User ID and topic are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create new debate session in database
    const savedDebate = await db
      .insert(debateSessions)
      .values({
        id: generateId(),
        userId,
        topic,
        isUserApologist: Boolean(isUserApologist),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return new Response(JSON.stringify(savedDebate[0]), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating debate:", error);

    let errorMessage = "Failed to create debate";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("UNIQUE constraint")) {
        errorMessage = "Debate session already exists";
        statusCode = 409;
      } else if (error.message.includes("NOT NULL constraint")) {
        errorMessage = "Missing required fields";
        statusCode = 400;
      } else if (error.message.includes("FOREIGN KEY constraint")) {
        errorMessage = "Invalid user ID";
        statusCode = 400;
      }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
};

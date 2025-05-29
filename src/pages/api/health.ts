import type { APIRoute } from "astro";
import { GeminiService } from "../../lib/apis/gemini";
import { ApologistProjectService } from "../../lib/apis/apologist-project";
import { validateEnvironment } from "../../lib/config";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const envValid = validateEnvironment();

    // Perform health checks
    const [geminiHealthy, apologistHealthy] = await Promise.allSettled([
      GeminiService.healthCheck(),
      ApologistProjectService.healthCheck(),
    ]);

    const geminiStatus =
      geminiHealthy.status === "fulfilled" && geminiHealthy.value;
    const apologistStatus =
      apologistHealthy.status === "fulfilled" && apologistHealthy.value;

    const overallHealthy = envValid && geminiStatus && apologistStatus;

    const healthData = {
      status: overallHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        environment: {
          status: envValid ? "healthy" : "unhealthy",
          message: envValid
            ? "All required environment variables are set"
            : "Missing required environment variables",
        },
        gemini: {
          status: geminiStatus ? "healthy" : "unhealthy",
          message: geminiStatus
            ? "Gemini API is responding"
            : "Gemini API is not responding",
        },
        apologistProject: {
          status: apologistStatus ? "healthy" : "unhealthy",
          message: apologistStatus
            ? "Apologist Project API is responding"
            : "Apologist Project API is not responding",
        },
      },
    };

    const statusCode = overallHealthy ? 200 : 503;

    return new Response(JSON.stringify(healthData), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Health check error:", error);

    return new Response(
      JSON.stringify({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

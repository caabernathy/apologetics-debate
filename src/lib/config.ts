const dbUrl = import.meta.env.TURSO_DB_URL || "http://localhost:8080";
const dbAuthToken = import.meta.env.TURSO_DB_AUTH_TOKEN || "";

export const database = {
  url: dbUrl,
  token: dbAuthToken,
};

export const betterAuthUrl =
  import.meta.env.BETTER_AUTH_URL || "http://localhost:4321";

// API Configuration
export const apiConfig = {
  gemini: {
    apiKey: import.meta.env.GOOGLE_GEMINI_API_KEY || "",
  },
  apologistProject: {
    apiKey: import.meta.env.APOLOGIST_PROJECT_API_KEY || "",
    baseUrl:
      import.meta.env.APOLOGIST_PROJECT_API_URL || "https://api.openai.com/v1",
  },
};

// Environment validation
export function validateEnvironment() {
  const requiredEnvVars = [
    "GOOGLE_GEMINI_API_KEY",
    "APOLOGIST_PROJECT_API_KEY",
  ];

  const missing = requiredEnvVars.filter(
    (varName) => !import.meta.env[varName],
  );

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(", ")}`);
    return false;
  }

  return true;
}

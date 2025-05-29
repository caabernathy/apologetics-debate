export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface ConversationMessage {
  id: string;
  sessionId: string;
  content: string;
  senderType: "USER" | "AI" | "EXPERT";
  createdAt: string;
  isExpertResponse?: boolean;
}

export interface DebateSession {
  id: string;
  userId: string;
  topic: string;
  isUserApologist: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export class ApiClient {
  static async request<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("API request failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  static async get<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: "GET" });
  }

  static async post<T>(url: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async put<T>(url: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: "DELETE" });
  }
}

export class ApiErrorHandler {
  static handleError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof Error) {
      return new ApiError(error.message);
    }

    return new ApiError("Unknown API error occurred");
  }

  static isNetworkError(error: unknown): boolean {
    return (
      error instanceof Error &&
      (error.message.includes("fetch") ||
        error.message.includes("network") ||
        error.message.includes("ECONNREFUSED"))
    );
  }

  static isRateLimitError(error: unknown): boolean {
    return error instanceof ApiError && error.status === 429;
  }

  static isAuthError(error: unknown): boolean {
    return (
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403)
    );
  }
}

export interface DebateFlow {
  sessionId: string;
  topic: string;
  isUserApologist: boolean;
  currentTurn: number;
  lastMessageType: "USER" | "AI" | "EXPERT";
}

export class DebateFlowManager {
  static determineNextAction(
    flow: DebateFlow,
  ): "user_input" | "ai_response" | "expert_available" {
    if (flow.isUserApologist) {
      // Apologist mode: AI asks, user responds
      if (flow.lastMessageType === "AI") {
        return "user_input";
      } else if (flow.lastMessageType === "USER") {
        return "ai_response";
      }
    } else {
      // Skeptic mode: User asks, AI responds
      if (flow.lastMessageType === "USER") {
        return "ai_response";
      } else if (flow.lastMessageType === "AI") {
        return "user_input";
      }
    }

    return "user_input";
  }

  static shouldShowExpertOption(flow: DebateFlow): boolean {
    return (
      flow.isUserApologist &&
      flow.lastMessageType === "AI" &&
      flow.currentTurn > 0
    );
  }
}

export const API_ENDPOINTS = {
  MESSAGES: "/api/messages",
  AI_RESPONSE: "/api/ai-response",
  DEBATES: "/api/debates",
  EXPERT_RESPONSE: "/api/expert-response",
} as const;

export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

export class RetryableApiClient extends ApiClient {
  static async requestWithRetry<T>(
    url: string,
    options: RequestInit = {},
    attempts: number = API_CONFIG.RETRY_ATTEMPTS,
  ): Promise<ApiResponse<T>> {
    for (let i = 0; i < attempts; i++) {
      const result = await this.request<T>(url, options);

      if (result.success || i === attempts - 1) {
        return result;
      }

      // Wait before retrying
      await new Promise((resolve) =>
        setTimeout(resolve, API_CONFIG.RETRY_DELAY * (i + 1)),
      );
    }

    return {
      success: false,
      error: "Max retry attempts exceeded",
    };
  }
}

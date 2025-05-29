import type { DebateMessage } from "../db/schema";

interface ConversationMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ApologistAPIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ChatCompletionRequest {
  model: string;
  stream: boolean;
  messages: ConversationMessage[];
  temperature?: number;
  max_completion_tokens?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  metadata?: {
    anonymous?: boolean;
    conversation?: string | null;
    language?: string;
    session?: string | null;
    translation?: string;
  };
  response_format?: { type: string };
}

async function callApologistAPI(
  request: ChatCompletionRequest,
): Promise<string> {
  const response = await fetch(
    `${import.meta.env.APOLOGIST_PROJECT_API_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.APOLOGIST_PROJECT_API_KEY,
      },
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  const data: ApologistAPIResponse = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response generated from Apologist Project API");
  }

  return content.trim();
}

async function generateChatCompletion(
  systemPrompt: string,
  conversationHistory: DebateMessage[],
  userPrompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const {
    temperature = 0.7,
    maxTokens = 1000,
  } = options;

  const contextMessages: ConversationMessage[] = conversationHistory.map(
    (msg) => ({
      role: msg.senderType === "USER" ? "user" : "assistant",
      content: msg.content,
    }),
  );

  const messages: ConversationMessage[] = [
    { role: "system", content: systemPrompt },
    ...contextMessages,
    { role: "user", content: userPrompt },
  ];

  return await callApologistAPI({
    model: "openai/gpt/4o",
    stream: false,
    messages,
    temperature,
    max_completion_tokens: maxTokens,
    top_p: 0.9,
    presence_penalty: 0.1,
    frequency_penalty: 0.1,
    metadata: {
      language: "en",
      translation: "esv",
    },
    response_format: { type: "json" },
  });
}

export class ApologistProjectService {
  static async generateApologeticResponse(
    question: string,
    conversationHistory: DebateMessage[] = [],
    topic?: string,
  ): Promise<string> {
    try {
      const systemPrompt = `You are an expert Christian apologist with deep knowledge of philosophy, theology, biblical studies, and classical apologetics. Your responses should be:

- Thoughtful and well-reasoned
- Grounded in evidence and logical argumentation
- Respectful toward skeptics while being confident in the truth
- Drawing from classical apologetic arguments (cosmological, teleological, moral, ontological)
- Incorporating relevant biblical scholarship and historical evidence
- Addressing objections directly and thoroughly
- Accessible to both beginners and advanced thinkers

${topic ? `Current debate topic: ${topic}` : ""}

Provide compelling apologetic responses that defend the Christian worldview with intellectual rigor and pastoral wisdom.`;

      return await generateChatCompletion(
        systemPrompt,
        conversationHistory,
        question
      );
    } catch (error) {
      console.error("Error calling Apologist Project API:", error);

      if (error instanceof Error) {
        throw new Error(`Apologist Project API error: ${error.message}`);
      }

      throw new Error("Failed to generate apologetic response");
    }
  }

  static async generateExpertResponse(
    skepticalQuestion: string,
    userAttempt: string,
    conversationHistory: DebateMessage[] = [],
    topic?: string,
  ): Promise<string> {
    try {
      const systemPrompt = `You are providing an expert apologetic response to help train aspiring apologists.

A user has attempted to answer a skeptical question, and you should provide the ideal apologetic response that demonstrates:
- More sophisticated argumentation
- Additional evidence or reasoning they may have missed
- Better structure and clarity
- Classical apologetic principles
- Relevant biblical and philosophical insights

${topic ? `Current debate topic: ${topic}` : ""}

Be constructive and educational in your expert response.`;

      const userPrompt = `Skeptical Question: ${skepticalQuestion}\n\nUser's Attempt: ${userAttempt}\n\nProvide the expert apologetic response:`;

      return await generateChatCompletion(
        systemPrompt,
        conversationHistory,
        userPrompt
      );
    } catch (error) {
      console.error("Error generating expert response:", error);

      if (error instanceof Error) {
        throw new Error(`Expert response API error: ${error.message}`);
      }

      throw new Error("Failed to generate expert response");
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      await callApologistAPI({
        model: "openai/gpt/4o",
        stream: false,
        messages: [{ role: "user", content: "Hello" }],
        max_completion_tokens: 5,
      });
      return true;
    } catch (error) {
      console.error("Apologist Project API health check failed:", error);
      return false;
    }
  }
}

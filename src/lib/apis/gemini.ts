import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: import.meta.env.GOOGLE_GEMINI_API_KEY!,
});

export class GeminiService {
  static async generateSkepticalQuestion(
    topic: string,
    conversationHistory: string[] = [],
    difficulty: "beginner" | "intermediate" | "advanced" = "intermediate",
  ): Promise<string> {
    try {
      const difficultyInstructions = {
        beginner:
          "Ask foundational questions that someone new to these topics might have. Keep the language accessible.",
        intermediate:
          "Ask probing questions that require solid apologetic knowledge to answer well. Challenge common assumptions.",
        advanced:
          "Ask sophisticated philosophical or theological questions that require deep expertise to address properly.",
      };

      const conversationContext =
        conversationHistory.length > 0
          ? `\n\nConversation so far:\n${conversationHistory.map((msg, i) => `${i % 2 === 0 ? "Skeptic" : "Apologist"}: ${msg}`).join("\n")}`
          : "";

      const prompt = `You are a thoughtful, intellectually honest skeptic engaging in a respectful debate about Christianity. Your role is to ask challenging but fair questions that help the apologist demonstrate and strengthen their faith-based arguments.

Topic: ${topic}
Difficulty Level: ${difficulty} - ${difficultyInstructions[difficulty]}

${conversationContext}

Guidelines for your next question:
- Be respectful but intellectually challenging
- Build logically on the previous conversation
- Ask questions that require substantive apologetic responses
- Focus on genuine philosophical, historical, or theological concerns
- Avoid strawman arguments or hostile language
- Encourage deeper thinking about the faith
- Draw from real skeptical positions found in academic literature

Generate your next skeptical question or objection that advances the conversation meaningfully:`;

      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: prompt,
      });
      const text = result.text;

      if (!text) {
        throw new Error("No response generated from Gemini API");
      }

      return text.trim();
    } catch (error) {
      console.error("Error calling Gemini API:", error);

      if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`);
      }

      throw new Error("Failed to generate skeptical question");
    }
  }

  static async generateTopicIntroduction(topic: string): Promise<string> {
    try {
      const prompt = `You are a thoughtful skeptic starting a respectful debate about Christianity.

Topic: ${topic}

Generate an opening statement or question that:
- Introduces the topic clearly
- Presents a genuine skeptical perspective
- Invites meaningful apologetic discussion
- Is respectful but intellectually challenging
- Sets a constructive tone for the debate

Provide a compelling opening that would engage an apologist in substantive discussion:`;

      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: prompt,
      });
      const text = result.text;

      if (!text) {
        throw new Error("No topic introduction generated from Gemini API");
      }

      return text.trim();
    } catch (error) {
      console.error("Error generating topic introduction:", error);

      if (error instanceof Error) {
        throw new Error(`Topic introduction error: ${error.message}`);
      }

      throw new Error("Failed to generate topic introduction");
    }
  }

  static async generateFollowUpQuestion(
    originalQuestion: string,
    apologistResponse: string,
    topic: string,
  ): Promise<string> {
    try {
      const prompt = `You are a thoughtful skeptic in a respectful debate about Christianity.

Topic: ${topic}
Your previous question: ${originalQuestion}
Apologist's response: ${apologistResponse}

Generate a thoughtful follow-up question that:
- Acknowledges the apologist's response respectfully
- Probes deeper into potential weaknesses or assumptions
- Advances the intellectual discussion
- Maintains a constructive tone
- Challenges the apologist to provide stronger evidence or reasoning

Your follow-up question:`;

      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: prompt,
      });
      const text = result.text;

      if (!text) {
        throw new Error("No follow-up question generated from Gemini API");
      }

      return text.trim();
    } catch (error) {
      console.error("Error generating follow-up question:", error);

      if (error instanceof Error) {
        throw new Error(`Follow-up question error: ${error.message}`);
      }

      throw new Error("Failed to generate follow-up question");
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: "Hello",
      });

      return result.text ? result.text.length > 0 : false;
    } catch (error) {
      console.error("Gemini API health check failed:", error);
      return false;
    }
  }
}

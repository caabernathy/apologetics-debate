import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { prompt, isUserApologist, conversationHistory } =
      await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // In a real app, this would call the Apologist Fusion API
    // For now, return a mock response
    const apiKey = import.meta.env.APOLOGIST_FUSION_API_KEY || "your-api-key";
    const apiEndpoint = "https://api.apologistproject.org/v1/chat/completions";

    /*
    // This is how a real API call would look
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'apologist-fusion',
        messages: [
          {
            role: 'system',
            content: isUserApologist
              ? 'You are playing the role of a skeptic challenging Christian beliefs. Generate thoughtful objections that would help a Christian practice their apologetics.'
              : 'You are a Christian apologist offering thoughtful, reasoned responses to skeptical questions and objections about Christianity.'
          },
          ...conversationHistory.map(msg => ({
            role: msg.senderType === 'USER' ? 'user' : 'assistant',
            content: msg.content
          })),
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    */

    // Mock response
    const mockResponse = {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "apologist-fusion",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: isUserApologist
              ? "But if God is all-powerful and all-loving as Christians claim, why does He allow so much suffering in the world? The existence of evil seems to contradict the idea of a perfectly good God. How do you reconcile this apparent contradiction?"
              : "That's an excellent question. The existence of God can be supported through several philosophical arguments. First, the cosmological argument points to the need for a first cause of the universe. Modern science confirms the universe had a beginning (the Big Bang), and anything that begins to exist must have a cause. Second, the fine-tuning of the universe's physical constants suggests design rather than chance. The values of these constants are precisely calibrated to allow for life, and the probability of this occurring randomly is infinitesimally small. Third, the existence of objective moral values points to a transcendent source of morality. Without God, it's difficult to explain why certain actions are objectively wrong regardless of cultural context. Would you like me to elaborate on any of these arguments?",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 150,
        completion_tokens: 200,
        total_tokens: 350,
      },
    };

    return new Response(JSON.stringify(mockResponse), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error calling Apologist Fusion API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

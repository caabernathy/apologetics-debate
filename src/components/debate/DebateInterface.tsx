import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import type { DebateMessage } from "../../lib/db/schema";
import { ApiClient, API_ENDPOINTS } from "../../lib/apis/api-client";

interface DebateInterfaceProps {
  sessionId: string;
  isUserApologist: boolean;
  topic: string;
  initialMessages?: DebateMessage[];
  onSendMessage?: (content: string) => Promise<void>;
}

export const DebateInterface: React.FC<DebateInterfaceProps> = ({
  sessionId,
  isUserApologist,
  topic,
  initialMessages = [],
  onSendMessage,
}) => {
  const [messages, setMessages] = useState<DebateMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showExpertResponse, setShowExpertResponse] = useState(false);
  const [expertResponse, setExpertResponse] = useState<string | null>(null);
  const [isExpertLoading, setIsExpertLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingInitial, setIsGeneratingInitial] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load existing messages when component mounts
  useEffect(() => {
    const loadMessages = async () => {
      if (sessionId === "new") return;

      try {
        const response = await ApiClient.get<DebateMessage[]>(
          `${API_ENDPOINTS.MESSAGES}?sessionId=${sessionId}`,
        );

        if (response.success && response.data) {
          setMessages(response.data);

          // If user is apologist and no messages exist, generate initial AI message
          if (isUserApologist && response.data.length === 0) {
            setIsGeneratingInitial(true);

            try {
              const initialResponse = await ApiClient.post<DebateMessage>(
                "/api/generate-initial-message",
                {
                  sessionId,
                  topic,
                },
              );

              if (initialResponse.success && initialResponse.data) {
                setMessages([initialResponse.data]);
              }
            } catch (initialError) {
              console.error("Error generating initial message:", initialError);
              setError("Failed to generate initial challenge");
            } finally {
              setIsGeneratingInitial(false);
            }
          }
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        setError("Failed to load conversation history");
      }
    };

    loadMessages();
  }, [sessionId, isUserApologist, topic]);

  // Auto-focus input after message is sent
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setExpertResponse(null);

    try {
      // Save user message to database
      const userResponse = await ApiClient.post<DebateMessage>(
        API_ENDPOINTS.MESSAGES,
        {
          sessionId,
          content: newMessage,
          senderType: "USER",
        },
      );

      if (!userResponse.success || !userResponse.data) {
        throw new Error(userResponse.error || "Failed to save user message");
      }

      if (userResponse.data) {
        setMessages((prev) => [...prev, userResponse.data!]);
      }
      const userMessageContent = newMessage;
      setNewMessage("");

      // Get AI response
      const aiResponse = await ApiClient.post<DebateMessage>(
        API_ENDPOINTS.AI_RESPONSE,
        {
          sessionId,
          userMessage: userMessageContent,
          isUserApologist,
          topic,
          type: "response",
        },
      );

      if (!aiResponse.success || !aiResponse.data) {
        throw new Error(aiResponse.error || "Failed to generate AI response");
      }

      if (aiResponse.data) {
        setMessages((prev) => [...prev, aiResponse.data!]);
      }

      // Call the optional onSendMessage callback if provided
      if (onSendMessage) {
        await onSendMessage(userMessageContent);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === "Escape") {
      setNewMessage("");
      setError(null);
    }
  };

  const getExpertResponse = async () => {
    if (!isUserApologist || messages.length === 0) return;

    setIsExpertLoading(true);
    setError(null);

    try {
      const lastAiMessage = messages.findLast((msg) => msg.senderType === "AI");
      const lastUserMessage = messages.findLast(
        (msg) => msg.senderType === "USER",
      );

      if (!lastAiMessage) {
        throw new Error("No AI question found for expert response");
      }

      const response = await ApiClient.post<{ content: string }>(
        API_ENDPOINTS.EXPERT_RESPONSE,
        {
          sessionId,
          skepticalQuestion: lastAiMessage.content,
          userAttempt: lastUserMessage?.content || "",
          topic,
        },
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to generate expert response");
      }

      setExpertResponse(response.data.content);
      setShowExpertResponse(true);
    } catch (error) {
      console.error("Error getting expert response:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to get expert response",
      );
    } finally {
      setIsExpertLoading(false);
    }
  };

  const useExpertResponse = async () => {
    if (!expertResponse || !isUserApologist) return;

    setIsLoading(true);
    setError(null);

    try {
      // Save expert response as user message
      const userResponse = await ApiClient.post<DebateMessage>(
        API_ENDPOINTS.MESSAGES,
        {
          sessionId,
          content: expertResponse,
          senderType: "USER",
          isExpertResponse: true,
        },
      );

      if (!userResponse.success || !userResponse.data) {
        throw new Error(userResponse.error || "Failed to save expert response");
      }

      if (userResponse.data) {
        setMessages((prev) => [...prev, userResponse.data!]);
      }

      // Generate next AI question
      const aiResponse = await ApiClient.post<DebateMessage>(
        API_ENDPOINTS.AI_RESPONSE,
        {
          sessionId,
          userMessage: expertResponse,
          isUserApologist,
          topic,
          type: "response",
        },
      );

      if (!aiResponse.success || !aiResponse.data) {
        throw new Error(aiResponse.error || "Failed to generate next question");
      }

      if (aiResponse.data) {
        setMessages((prev) => [...prev, aiResponse.data!]);
      }
      setExpertResponse(null);
      setShowExpertResponse(false);
    } catch (error) {
      console.error("Error using expert response:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to use expert response",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageLabel = (senderType: string) => {
    if (senderType === "USER") {
      return "You";
    } else if (senderType === "EXPERT") {
      return "Expert Response";
    } else {
      return isUserApologist ? "Skeptic AI" : "Apologist AI";
    }
  };

  return (
    <div className="flex flex-col h-[80vh]">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}
          {messages.length === 0 ? (
            <div className="text-center p-8">
              {isGeneratingInitial ? (
                <div>
                  <div className="ai-message inline-block">
                    <p className="text-xs mb-1 text-neutral-600">Skeptic AI</p>
                    <div className="typing-indicator text-neutral-500">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                  <p className="text-neutral-500 mt-4">
                    Generating your first skeptical challenge...
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-neutral-500">
                    {isUserApologist
                      ? "The AI will present skeptical arguments for you to respond to as an apologist."
                      : "You can ask questions or present objections to the Christian faith, and the AI will respond as an apologist."}
                  </p>
                  <p className="text-neutral-500 mt-2">
                    Start the conversation below!
                  </p>
                </div>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderType === "USER" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] ${message.senderType === "USER" ? "user-message" : "ai-message"}`}
                >
                  <p
                    className={`text-xs mb-1 ${message.senderType === "USER" ? "text-primary-600" : "text-neutral-600"}`}
                  >
                    {getMessageLabel(message.senderType)}
                  </p>
                  <div className="prose prose-sm max-w-none">
                    {message.senderType === "AI" ||
                    message.senderType === "EXPERT" ? (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="ai-message">
                <p className="text-xs mb-1 text-neutral-600">
                  {isUserApologist ? "Skeptic AI" : "Apologist AI"}
                </p>
                <div className="typing-indicator text-neutral-500">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          {isUserApologist &&
            messages.length > 0 &&
            messages[messages.length - 1].senderType === "AI" &&
            !isLoading && (
              <div className="mt-4">
                {expertResponse ? (
                  showExpertResponse ? (
                    <Card className="border-2 border-secondary-200 bg-secondary-50">
                      <div className="p-4">
                        <h4 className="text-lg font-medium text-secondary-800 mb-2">
                          Expert Apologist Response:
                        </h4>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{expertResponse}</ReactMarkdown>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={useExpertResponse}
                            isLoading={isLoading}
                          >
                            Use This Response
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowExpertResponse(false)}
                          >
                            Hide
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <div className="text-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowExpertResponse(true)}
                      >
                        Show Expert Response
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="text-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={getExpertResponse}
                      isLoading={isExpertLoading}
                    >
                      Get Expert Response
                    </Button>
                  </div>
                )}
              </div>
            )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-neutral-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <textarea
            ref={inputRef}
            className="form-input resize-none flex-1"
            placeholder={
              isUserApologist
                ? "Enter your apologetic response... (Ctrl+Enter to send, Esc to clear)"
                : "Ask a question or present an objection... (Ctrl+Enter to send, Esc to clear)"
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={isLoading}
            autoFocus
          />
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!newMessage.trim() || isLoading}
          >
            Send
          </Button>
        </form>

        <div className="mt-2 text-xs text-neutral-500 text-center">
          This app uses AI-generated content. Always consult human theological
          sources.
          <br />
          <span className="text-neutral-400">
            Tip: Use Ctrl+Enter to send, Esc to clear
          </span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";

interface Topic {
  id: string;
  title: string;
  description: string;
}

interface TopicSelectorProps {
  userId: string;
}

const predefinedTopics: Topic[] = [
  {
    id: "existence-of-god",
    title: "The Existence of God",
    description:
      "Explore philosophical arguments for and against the existence of God.",
  },
  {
    id: "problem-of-evil",
    title: "The Problem of Evil",
    description: "How can a good God allow suffering in the world?",
  },
  {
    id: "reliability-of-scripture",
    title: "Reliability of Scripture",
    description:
      "Examining the historical and textual reliability of the Bible.",
  },
  {
    id: "resurrection",
    title: "The Resurrection of Jesus",
    description: "Historical evidence for the resurrection of Jesus Christ.",
  },
  {
    id: "science-faith",
    title: "Science and Faith",
    description: "Are science and Christianity compatible or in conflict?",
  },
  {
    id: "morality",
    title: "Objective Morality",
    description: "Can objective moral values exist without God?",
  },
];

export const TopicSelector: React.FC<TopicSelectorProps> = ({ userId }) => {
  const [customTopic, setCustomTopic] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [userRole, setUserRole] = useState<"apologist" | "skeptic">("skeptic");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDebate = async (topicName: string, isUserApologist: boolean) => {
    console.log("🚀 Creating debate:", { topicName, isUserApologist, userId });
    setIsLoading(true);
    setError(null);

    try {
      const requestBody = {
        userId,
        topic: topicName,
        isUserApologist,
      };
      console.log("📤 Sending request to /api/start-debate:", requestBody);
      
      const response = await fetch("/api/start-debate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log("📥 Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API Error:", errorData);
        throw new Error(errorData.error || "Failed to create debate session");
      }

      const data = await response.json();
      console.log("✅ Debate created successfully:", data);

      // Redirect to the new debate session
      const redirectUrl = `/debate/${data.debate.id}?topic=${encodeURIComponent(topicName)}&isUserApologist=${isUserApologist}`;
      console.log("🔄 Redirecting to:", redirectUrl);
      window.location.href = redirectUrl;
    } catch (error) {
      console.error("💥 Error creating debate:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create debate session",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTopic.trim() && !isLoading) {
      createDebate(customTopic.trim(), userRole === "apologist");
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-serif mb-2">Choose Your Role</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <Card
            className={`flex-1 cursor-pointer transition ${
              userRole === "skeptic" ? "ring-2 ring-primary-500" : ""
            }`}
            onClick={() => setUserRole("skeptic")}
          >
            <CardContent className="text-center p-6">
              <h3 className="font-medium text-lg mb-2">You as the Skeptic</h3>
              <p className="text-neutral-600">
                Challenge the AI apologist with your questions and objections.
              </p>
            </CardContent>
          </Card>

          <Card
            className={`flex-1 cursor-pointer transition ${
              userRole === "apologist" ? "ring-2 ring-primary-500" : ""
            }`}
            onClick={() => setUserRole("apologist")}
          >
            <CardContent className="text-center p-6">
              <h3 className="font-medium text-lg mb-2">You as the Apologist</h3>
              <p className="text-neutral-600">
                Practice your apologetics against AI-generated objections.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <h2 className="text-2xl font-serif mb-4">Select a Topic</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {predefinedTopics.map((topic) => (
          <Card
            key={topic.id}
            className={`cursor-pointer hover:shadow-md transition ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => {
              console.log("🎯 Topic clicked:", topic.title, "Role:", userRole);
              !isLoading && createDebate(topic.title, userRole === "apologist");
            }}
            hoverable
          >
            <CardContent>
              <h3 className="font-medium text-lg">{topic.title}</h3>
              <p className="text-neutral-600 text-sm mt-1">
                {topic.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!showCustom ? (
        <Button
          variant="outline"
          onClick={() => setShowCustom(true)}
          className="w-full"
        >
          Create Custom Topic
        </Button>
      ) : (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmitCustom}>
              <div className="mb-4">
                <label htmlFor="customTopic" className="form-label">
                  Custom Topic or Question
                </label>
                <input
                  id="customTopic"
                  type="text"
                  className="form-input"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Enter your own topic or specific question..."
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCustom(false);
                    setCustomTopic("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!customTopic.trim() || isLoading}
                  isLoading={isLoading}
                >
                  Start Debate
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import type { DebateSession } from "../../lib/db/schema";

interface DebateHistoryProps {
  userId: string;
  onSelectDebate: (debateId: string) => void;
}

export const DebateHistory: React.FC<DebateHistoryProps> = ({
  userId,
  onSelectDebate,
}) => {
  const [debates, setDebates] = useState<DebateSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebates = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/debates?userId=${userId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle specific error cases
        if (
          response.status === 503 &&
          errorData.error?.includes("Database not initialized")
        ) {
          // Database hasn't been set up yet - this is expected for new installations
          setDebates([]);
          return;
        } else if (response.status === 400) {
          setError("Invalid user session. Please try signing out and back in.");
          return;
        } else {
          throw new Error(errorData.error || "Failed to fetch debates");
        }
      }

      const data = await response.json();

      // Ensure data is an array (handle malformed responses)
      if (Array.isArray(data)) {
        setDebates(data);
      } else {
        console.error("Invalid response format:", data);
        setDebates([]);
      }
    } catch (err) {
      console.error("Error fetching debates:", err);
      setError("Failed to load your debate history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchDebates();
  };

  useEffect(() => {
    fetchDebates();
  }, [userId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mb-4 h-24 bg-neutral-100 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-accent-50 text-accent-700 rounded-md">
        <p className="mb-3">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={loading}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (debates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-500 mb-4">
          You haven't started any debates yet.
        </p>
        <Button
          variant="primary"
          onClick={() => (window.location.href = "/new-debate")}
        >
          Start Your First Debate
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {debates.map((debate) => (
        <Card
          key={debate.id}
          className="transition-all hover:shadow-md cursor-pointer"
          onClick={() => onSelectDebate(debate.id)}
          hoverable
        >
          <CardContent className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-lg">{debate.topic}</h3>
              <p className="text-sm text-neutral-500">
                {new Date(debate.updatedAt).toLocaleDateString()}
                {debate.isUserApologist
                  ? " • You as Apologist"
                  : " • You as Skeptic"}
              </p>
            </div>
            <Button size="sm" variant="outline">
              Continue
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

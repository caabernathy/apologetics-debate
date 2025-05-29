import React, { useState } from "react";
import { authClient } from "../../lib/auth-client";
import { Button } from "../ui/Button";

interface SignOutButtonProps {
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  children?: React.ReactNode;
}

export const SignOutButton: React.FC<SignOutButtonProps> = ({
  variant = "outline",
  className = "",
  children = "Sign Out",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await authClient.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleSignOut}
      isLoading={isLoading}
      type="button"
    >
      {children}
    </Button>
  );
};

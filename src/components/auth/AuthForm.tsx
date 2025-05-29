import React, { useState } from "react";
import { authClient } from "../../lib/auth-client";
import { Button } from "../ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../ui/Card";

enum AuthMode {
  SIGN_IN,
  SIGN_UP,
}

export const AuthForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>(AuthMode.SIGN_IN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === AuthMode.SIGN_IN) {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/",
        });
        if (signInError) throw signInError;
        // on success, Better-Auth will set cookies and redirect
      } else {
        const { error: signUpError } = await authClient.signUp.email({
          email,
          password,
          name: email,
          callbackURL: "/",
        });
        if (signUpError) throw signUpError;
        setMessage("Check your email for the confirmation link.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === AuthMode.SIGN_IN ? AuthMode.SIGN_UP : AuthMode.SIGN_IN);
    setError(null);
    setMessage(null);
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === AuthMode.SIGN_IN ? "Sign In" : "Create Account"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-accent-50 text-accent-700 rounded-md border border-accent-200">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-200">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" fullWidth isLoading={loading}>
            {mode === AuthMode.SIGN_IN ? "Sign In" : "Create Account"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="text-center">
        <p className="text-neutral-600">
          {mode === AuthMode.SIGN_IN
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            className="text-primary-600 hover:text-primary-800 font-medium"
            onClick={toggleMode}
          >
            {mode === AuthMode.SIGN_IN ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </CardFooter>
    </Card>
  );
};

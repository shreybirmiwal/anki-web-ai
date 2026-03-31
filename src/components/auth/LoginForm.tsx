"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="card stack"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") || "");
        const password = String(form.get("password") || "");
        setLoading(true);
        setError(null);
        try {
          const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl: "/decks",
          });
          if (!result || result.error || !result.ok) {
            setError("Invalid email/password or session issue. Please try again.");
            setLoading(false);
            return;
          }
          window.location.href = result.url || "/decks";
        } catch {
          setError("Login failed due to a network/server issue.");
          setLoading(false);
          return;
        }
      }}
    >
      <h1>Log in</h1>
      <label className="field">
        Email
        <input type="email" name="email" required />
      </label>
      <label className="field">
        Password
        <input type="password" name="password" minLength={8} required />
      </label>
      {error ? <p className="muted">{error}</p> : null}
      <button className="button" disabled={loading} type="submit">
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

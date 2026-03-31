"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="card stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        const form = new FormData(event.currentTarget);
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: form.get("email"),
            password: form.get("password"),
            name: form.get("name"),
          }),
        });
        setLoading(false);
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          setError(data.error || "Could not create account.");
          return;
        }
        setSuccess("Account created. You can log in now.");
        router.push("/login");
      }}
    >
      <h1>Create account</h1>
      <label className="field">
        Name
        <input type="text" name="name" />
      </label>
      <label className="field">
        Email
        <input type="email" name="email" required />
      </label>
      <label className="field">
        Password
        <input type="password" name="password" minLength={8} required />
      </label>
      {error ? <p className="muted">{error}</p> : null}
      {success ? <p className="muted">{success}</p> : null}
      <button className="button" disabled={loading} type="submit">
        {loading ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}

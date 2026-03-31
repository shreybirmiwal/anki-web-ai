"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="button secondary"
      onClick={() => signOut({ callbackUrl: "/login" })}
      type="button"
    >
      Log out
    </button>
  );
}

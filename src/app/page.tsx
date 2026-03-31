import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    redirect("/decks");
  }

  return (
    <div className="stack">
      <h1>Build retention with AI-powered spaced repetition</h1>
      <p>
        Create decks, review cards with Anki-style scheduling, and generate new cards from your
        notes.
      </p>
      <div className="row">
        <Link className="button" href="/login">
          Log in
        </Link>
        <Link className="button secondary" href="/register">
          Create account
        </Link>
      </div>
    </div>
  );
}

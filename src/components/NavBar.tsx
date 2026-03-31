import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function NavBar() {
  const session = await getServerSession(authOptions);

  return (
    <header className="app-header">
      <div className="container nav">
        <Link href="/" className="brand">
          AI Anki
        </Link>
        <nav className="nav-links">
          <Link href="/decks">Decks</Link>
          <Link href="/ai">AI Generate</Link>
          {!session ? <Link href="/login">Login</Link> : <span>{session.user.email}</span>}
        </nav>
      </div>
    </header>
  );
}

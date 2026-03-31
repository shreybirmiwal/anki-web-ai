import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { authOptions } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    redirect("/decks");
  }

  return (
    <div className="grid two">
      <LoginForm />
      <section className="card stack">
        <h2>New here?</h2>
        <p className="muted">Create an account to start building decks and reviewing cards.</p>
        <Link href="/register" className="button secondary">
          Create an account
        </Link>
      </section>
    </div>
  );
}

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
        <h2>Demo credentials</h2>
        <p className="muted">Run the seed command, then log in with:</p>
        <p>
          <strong>Email:</strong> demo@aianki.dev
        </p>
        <p>
          <strong>Password:</strong> demo12345
        </p>
        <Link href="/register" className="button secondary">
          Need an account?
        </Link>
      </section>
    </div>
  );
}

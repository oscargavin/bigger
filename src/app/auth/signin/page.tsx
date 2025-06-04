import { SignInForm } from "@/components/auth/sign-in-form";
import Link from "next/link";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 lg:p-8">
        <Link
          href="/"
          className="flex items-center gap-3 text-foreground hover:text-primary transition-colors"
        >
          <Image
            src="/android-chrome-512x512.png"
            alt="Bigger Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-xl font-semibold">Bigger</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-2">
              Sign in to continue your fitness journey
            </p>
          </div>
          <SignInForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted-foreground">
        <p>&copy; 2025 Bigger. All rights reserved.</p>
      </footer>
    </div>
  );
}

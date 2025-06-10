import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-8">Welcome to Habit Tracker</h1>
      <p className="mb-8 text-lg text-gray-700">
        Start building better habits today. Log in to track your progress and achieve your goals.
      </p>
      <Button asChild size="lg">
        <Link href="/auth/login">Login</Link>
      </Button>
    </div>
  );
}

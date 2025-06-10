"use client"; // Required for useSession and signOut

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button'; // Using shadcn/ui Button

export default function Header() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Habit Tracker
        </Link>
        <nav className="flex items-center">
          {isLoading ? (
            <p className="mr-4">Loading...</p>
          ) : session ? (
            <>
              <Link href="/dashboard" className="mr-4 hover:text-gray-300">
                Dashboard
              </Link>
              <span className="mr-4">
                {session.user?.name || session.user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })} // Redirect to home after logout
                className="bg-transparent hover:bg-gray-700 text-white hover:text-white border-white"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              {/* Dashboard link can be hidden or shown based on preference when not logged in */}
              {/* <Link href="/dashboard" className="mr-4 hover:text-gray-300">Dashboard</Link> */}
              <Button asChild variant="outline" size="sm" className="bg-transparent hover:bg-gray-700 text-white hover:text-white border-white">
                <Link href="/auth/login">Login</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

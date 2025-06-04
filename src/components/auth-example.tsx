'use client';

import { api } from '@/utils/api';
import { useState } from 'react';

/**
 * Example component showing how to use tRPC with the auth router
 */
export function AuthExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Query to get current user
  const { data: user, isLoading } = api.auth.getUser.useQuery();

  // Mutations
  const signInMutation = api.auth.signIn.useMutation({
    onSuccess: () => {
      // Refetch user after successful sign in
      api.auth.getUser.useQuery();
    },
    onError: (error) => {
      console.error('Sign in error:', error.message);
    },
  });

  const signOutMutation = api.auth.signOut.useMutation({
    onSuccess: () => {
      // Refetch user after sign out
      api.auth.getUser.useQuery();
    },
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    signInMutation.mutate({ email, password });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Welcome!</h2>
        <p className="mb-4">You are signed in as: {user?.email}</p>
        <button
          onClick={() => signOutMutation.mutate()}
          disabled={signOutMutation.isPending}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {signOutMutation.isPending ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Sign In</h2>
      <form onSubmit={handleSignIn} className="space-y-4 max-w-md">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        {signInMutation.error && (
          <p className="text-red-500 text-sm">{signInMutation.error.message}</p>
        )}
        <button
          type="submit"
          disabled={signInMutation.isPending}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {signInMutation.isPending ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Mock user list for demonstration
const users = [
  { id: "1", name: "Test User", email: "test@example.com", password: "password" },
  { id: "2", name: "Admin User", email: "admin@example.com", password: "admin" },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials) {
          return null;
        }
        const user = users.find(
          (user) =>
            user.email === credentials.email &&
            user.password === credentials.password
        );

        if (user) {
          // Return a user object that NextAuth can use
          // For this subtask, hardcode backend userId. In real scenario, this would come from backend.
          return { id: user.id, name: user.name, email: user.email, userId: "1" };
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null;
          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    // error: '/auth/error', // Custom error page (optional)
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the user id and name to the token
      if (user) {
        // Note: 'user' object here is the one returned from 'authorize'
        token.id = user.id; // This is the NextAuth internal user.id (usually a string from provider)
        token.name = user.name;
        token.email = user.email;
        token.userId = user.userId; // Persist backend userId to token
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      // 'token' here is the JWT token that includes properties added in the 'jwt' callback
      if (session.user) {
        session.user.id = token.id as string; // NextAuth user id
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.userId = token.userId; // Add backend userId to session user object
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

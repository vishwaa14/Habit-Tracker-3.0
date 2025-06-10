import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's backend ID. */
      id?: string | number | null; // Match backend User ID type (Long -> number or string)
      userId?: string | number | null; // Adding this as per instructions for clarity
    } & DefaultSession["user"]; // Keep existing properties like name, email, image
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends DefaultUser {
    userId?: string | number | null; // Backend User ID
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    /** Backend User ID */
    userId?: string | number | null;
  }
}

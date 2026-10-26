import type { NextAuthConfig } from "next-auth";

/** Config compatible Edge (middleware) — sans Prisma. */
export const authConfig = {
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = String(token.email ?? "");
        session.user.name = token.name as string | null | undefined;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;

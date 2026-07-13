import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Login throttle: block an account after too many failures in a window.
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILURES = 8;

class RateLimitError extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const username = String(credentials.username);

        const since = new Date(Date.now() - LOGIN_WINDOW_MS);
        const recentFailures = await prisma.loginAttempt.count({
          where: { username, success: false, createdAt: { gte: since } },
        });
        if (recentFailures >= MAX_FAILURES) {
          throw new RateLimitError();
        }

        const user = await prisma.user.findUnique({ where: { username } });
        const valid = user
          ? await bcrypt.compare(String(credentials.password), user.password)
          : false;

        await prisma.loginAttempt.create({ data: { username, success: valid } });

        if (!user || !valid) return null;
        return { id: user.id, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as any).role = token.role;
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});

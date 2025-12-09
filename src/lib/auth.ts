import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Demo users for development
const DEMO_USERS = [
  {
    id: "admin-1",
    email: "admin@biomo.com.br",
    password: "admin123",
    name: "Administrador",
    role: "admin",
  },
  {
    id: "team-1",
    email: "equipe@biomo.com.br",
    password: "equipe123",
    name: "Equipe Biomo",
    role: "team",
  },
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] authorize called:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Missing credentials");
          return null;
        }

        const user = DEMO_USERS.find(
          (u) =>
            u.email === credentials.email && u.password === credentials.password
        );

        if (user) {
          console.log("[AUTH] User found:", user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        console.log("[AUTH] User not found");
        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // CRITICAL: Firebase Hosting only forwards the __session cookie to Cloud Functions
  // All other cookies are stripped by the CDN for caching purposes
  // See: https://firebase.google.com/docs/hosting/manage-cache
  cookies: {
    sessionToken: {
      name: "__session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    callbackUrl: {
      name: "__session-callback",
      options: {
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    csrfToken: {
      name: "__session-csrf",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
});

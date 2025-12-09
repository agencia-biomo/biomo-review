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
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = DEMO_USERS.find(
          (u) =>
            u.email === credentials.email && u.password === credentials.password
        );

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});

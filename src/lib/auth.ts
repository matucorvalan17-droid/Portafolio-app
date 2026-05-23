import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const user = await db.user.findUnique({ where: { email: credentials.email } });
          if (!user) return null;
          const valid = await compare(credentials.password, user.password);
          if (!valid) return null;
          return { id: user.id, email: user.email, name: user.name, image: user.image ?? undefined };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id    = user.id;
        token.email = user.email;
        token.name  = user.name;
        token.image = user.image ?? null;
      }
      if (trigger === 'update' && session) {
        if (session.name)  token.name  = session.name;
        if (session.email) token.email = session.email;
        token.image = session.image ?? token.image ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id    = token.id    as string;
        session.user.email = token.email as string;
        session.user.name  = token.name  as string;
        (session.user as { id: string; email: string; name: string; image: string | null }).image = (token.image as string | null) ?? null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

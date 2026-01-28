import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt" as const,
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.password) {
                    // If user doesn't exist, create him for demo purposes
                    // In a real app, you'd have a separate signup flow
                    const hashedPassword = await bcrypt.hash(credentials.password, 10);
                    const newUser = await prisma.user.create({
                        data: {
                            email: credentials.email,
                            password: hashedPassword,
                            name: credentials.email.split('@')[0],
                        },
                    });
                    return newUser;
                }

                const isPasswordCorrect = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordCorrect) {
                    throw new Error("Invalid password");
                }

                return user;
            },
        }),
    ],
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        async session({ session, token }: { session: any, token: any }) {
            if (token && session.user) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }: { token: any, user: any }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

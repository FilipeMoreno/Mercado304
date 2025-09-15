import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};


const prismaClientSingleton = () => {
	return new PrismaClient({
		log: ["query"],
	}).$extends(withAccelerate());
};

const prismaBase = globalForPrisma.prisma ?? prismaClientSingleton();

export const prisma = prismaBase as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prismaBase as any;
}

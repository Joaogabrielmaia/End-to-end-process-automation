import { PrismaClient } from "@prisma/client";
import { seedDatabase, SEED_CUSTOMERS, SEED_PRODUCTS } from "../src/lib/seed-data";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .then(() => console.log(`Seed ok: ${SEED_CUSTOMERS.length} clientes, ${SEED_PRODUCTS.length} produtos (dados fictícios).`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

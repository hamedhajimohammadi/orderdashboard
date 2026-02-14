
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { 
        OR: [
            { display_name: 'لیلا محمدی' },
            { first_name: 'لیلا', last_name: 'محمدی' }
        ]
    }
  });
  console.log("User:", user);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

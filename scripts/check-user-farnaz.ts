
import { prisma } from '../lib/prisma';

async function checkUserFarnaz() {
  console.log('Checking user "farnaz"');

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { admin_username: { contains: 'farnaz', mode: 'insensitive' } },
        { display_name: { contains: 'farnaz', mode: 'insensitive' } },
        { display_name: { contains: 'فرناز', mode: 'insensitive' } }
      ]
    }
  });

  console.log(`Found ${users.length} users:`);
  console.table(users.map(u => ({ id: u.id, username: u.admin_username, display: u.display_name })));
}

checkUserFarnaz()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

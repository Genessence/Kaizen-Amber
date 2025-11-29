/**
 * Verification script to check user-plant associations
 * Run this to verify all users have correct plant associations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying user-plant associations...\n');

  // Get all plant users
  const users = await prisma.user.findMany({
    where: {
      role: 'plant',
    },
    include: {
      plant: {
        select: {
          id: true,
          name: true,
          shortName: true,
        },
      },
    },
  });

  console.log(`Found ${users.length} plant users:\n`);

  for (const user of users) {
    const plantInfo = user.plant
      ? `${user.plant.name} (ID: ${user.plant.id})`
      : '❌ NO PLANT ASSOCIATED';
    
    console.log(`📧 ${user.email}`);
    console.log(`   Name: ${user.fullName}`);
    console.log(`   Plant: ${plantInfo}`);
    console.log(`   Plant ID in user record: ${user.plantId || 'NULL'}\n`);
  }

  // Check for mismatches
  const mismatches = users.filter(
    (user) => !user.plant || user.plantId !== user.plant.id
  );

  if (mismatches.length > 0) {
    console.log(`⚠️  Found ${mismatches.length} users with incorrect plant associations:\n`);
    for (const user of mismatches) {
      console.log(`   ${user.email}: Expected plant ID ${user.plant?.id}, but has ${user.plantId}`);
    }
  } else {
    console.log('✅ All users have correct plant associations!');
  }
}

main()
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


/**
 * Prisma seed script to insert all plants and user credentials for testing
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/bcrypt';

const prisma = new PrismaClient();

/**
 * Convert plant name to email prefix
 * Example: "Greater Noida (Ecotech 1)" -> "greaternoida"
 * Pattern: lowercase, remove spaces, remove content in parentheses
 */
function plantNameToEmailPrefix(plantName: string): string {
  // Remove content in parentheses and the parentheses themselves
  let cleaned = plantName.replace(/\([^)]*\)/g, '').trim();
  
  // Convert to lowercase and remove spaces
  cleaned = cleaned.toLowerCase().replace(/\s+/g, '');
  
  // Remove any remaining special characters (keep only alphanumeric)
  cleaned = cleaned.replace(/[^a-z0-9]/g, '');
  
  return cleaned;
}

async function main() {
  console.log('🌱 Starting seed script...\n');

  // Define all plants
  const plants = [
    { name: 'Greater Noida (Ecotech 1)', shortName: 'Greater Noida', division: 'Component' },
    { name: 'Kanchipuram', shortName: 'Kanchipuram', division: 'Component' },
    { name: 'Rajpura', shortName: 'Rajpura', division: 'Component' },
    { name: 'Shahjahanpur', shortName: 'Shahjahanpur', division: 'Component' },
    { name: 'Supa', shortName: 'Supa', division: 'Component' },
    { name: 'Ranjangaon', shortName: 'Ranjangaon', division: 'Component' },
    { name: 'Ponneri', shortName: 'Ponneri', division: 'Component' },
  ];

  // Hash password once for all users
  const hashedPassword = await hashPassword('plant123');
  console.log('✅ Password hashed successfully\n');

  // Insert plants and create users
  for (const plantData of plants) {
    try {
      // Check if plant exists, if not create it
      let plant = await prisma.plant.findFirst({
        where: { name: plantData.name },
      });

      if (!plant) {
        plant = await prisma.plant.create({
          data: {
            name: plantData.name,
            shortName: plantData.shortName,
            division: plantData.division,
            isActive: true,
          },
        });
        console.log(`✅ Plant "${plantData.name}" created successfully (ID: ${plant.id})`);
      } else {
        // Update existing plant
        plant = await prisma.plant.update({
          where: { id: plant.id },
          data: {
            shortName: plantData.shortName,
            division: plantData.division,
            isActive: true,
          },
        });
        console.log(`✅ Plant "${plantData.name}" updated successfully (ID: ${plant.id})`);
      }

      // Generate email from plant name
      const emailPrefix = plantNameToEmailPrefix(plantData.name);
      const email = `${emailPrefix}@amber.com`;
      const fullName = `${plantData.shortName} Admin`;

      // Check if user exists, if not create it
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            fullName,
            hashedPassword,
            role: 'plant',
            plantId: plant.id,
            isActive: true,
          },
        });
        console.log(`✅ User "${email}" created successfully (ID: ${user.id})`);
      } else {
        // Update existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            fullName,
            hashedPassword,
            role: 'plant',
            plantId: plant.id,
            isActive: true,
          },
        });
        console.log(`✅ User "${email}" updated successfully (ID: ${user.id})`);
      }

      console.log(`   Credentials: ${email} / plant123\n`);
    } catch (error) {
      console.error(`❌ Error processing ${plantData.name}:`, error);
      throw error;
    }
  }

  console.log('🎉 Seed script completed successfully!');
  console.log('\n📋 Summary:');
  console.log('   - 7 plants inserted/updated');
  console.log('   - 7 user accounts created/updated');
  console.log('   - All users have password: plant123');
}

main()
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

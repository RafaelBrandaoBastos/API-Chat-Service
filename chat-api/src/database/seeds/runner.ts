import { dataSource } from '../typeorm.config';
import { seedUsers } from './user.seed';
import { seedRooms } from './room.seed';
import { seedMessages } from './message.seed';

async function main() {
  try {
    // Initialize connection
    await dataSource.initialize();
    console.log('Database connection initialized');

    // Run seeds in sequence
    const users = await seedUsers(dataSource);
    const rooms = await seedRooms(dataSource, users);
    await seedMessages(dataSource, users, rooms);

    console.log('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  }
}

// Run the seed process
main();

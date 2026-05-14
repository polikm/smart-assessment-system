import app from './app.js';
import { initDb } from './db.js';
import { seedData } from './seed.js';

const PORT = process.env.PORT || 3001;

async function startServer() {
  await initDb();

  // seedData 失败不应阻止服务器启动
  try {
    await seedData();
  } catch (error: any) {
    console.error('Seed data failed:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});

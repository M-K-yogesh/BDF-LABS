const { createApp } = require('./app');
const { openDatabase } = require('./db');

async function startServer() {
  const db = await openDatabase();
  const app = createApp(db);
  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, () => {
    console.log(`Books API listening on port ${port}`);
  });

  server.on('error', async (error) => {
    await db.close();
    console.error(`Unable to start server: ${error.message}`);
    process.exitCode = 1;
  });
}

startServer().catch((error) => {
  console.error(`Unable to initialize Books API: ${error.message}`);
  process.exitCode = 1;
});

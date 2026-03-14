const { Sequelize } = require('sequelize');

async function check() {
  const sequelize = new Sequelize('yozo', 'postgres', 'postgres', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
  });

  try {
    const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema='yozo'");
    console.log("Tables:", results.map(r => r.table_name));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();

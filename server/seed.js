const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

async function check() {
  const sequelize = new Sequelize('yozo', 'postgres', 'postgres', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
  });

  try {
    const hash = await bcrypt.hash('admin123', 10);
    
    // We can just use Sequelize's define or raw query but ensuring proper quotes.
    // In PostgreSQL, yozo.logindetail must exist since sync() creates it using the schema name matching the tenant.
    // Wait, if tenant ID is 'tenanta', will it create schema 'tenanta'? Let's check.
    
    await sequelize.query(`
      INSERT INTO tenanta.logindetail ("name", "adhaar", "password", "role") 
      VALUES ('admin', 'admin', '${hash}', 'admin')
    `);
    console.log("Admin generated in tenanta.");
    process.exit(0);
  } catch (error) {
    try {
      const hash = await bcrypt.hash('admin123', 10);
      await sequelize.query(`
        INSERT INTO yozo.logindetail ("name", "adhaar", "password", "role") 
        VALUES ('admin', 'admin', '${hash}', 'admin')
      `);
      console.log("Admin generated in yozo.");
      process.exit(0);
    } catch(e) {
      console.error(e);
      process.exit(1);
    }
  }
}

check();

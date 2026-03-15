const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

async function seed() {
  const sequelize = new Sequelize('yozo', 'postgres', 'postgres', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
  });

  try {
    const hash = await bcrypt.hash('admin123', 10);
    const users = [
      { name: 'Principal Demo', adhaar: 'principal', password: hash, role: 'principal' },
      { name: 'Teacher Demo', adhaar: 'teacher', password: hash, role: 'teacher' },
      { name: 'Student Demo', adhaar: 'student', password: hash, role: 'student' }
    ];

    for (const u of users) {
      // Upsert logic rough equivalent: delete if exists, then insert
      await sequelize.query(`DELETE FROM tenanta.logindetail WHERE adhaar = '${u.adhaar}'`).catch(()=>null);
      await sequelize.query(`
        INSERT INTO tenanta.logindetail ("name", "adhaar", "password", "role") 
        VALUES ('${u.name}', '${u.adhaar}', '${u.password}', '${u.role}')
      `);
      console.log(`Created ${u.role}: Username (adhaar) = ${u.adhaar}, Password = admin123`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Failed to seed tenanta. Trying yozo schema...");
    try {
      const hash = await bcrypt.hash('admin123', 10);
      const users = [
        { name: 'Principal Demo', adhaar: 'principal', password: hash, role: 'principal' },
        { name: 'Teacher Demo', adhaar: 'teacher', password: hash, role: 'teacher' },
        { name: 'Student Demo', adhaar: 'student', password: hash, role: 'student' }
      ];
  
      for (const u of users) {
        await sequelize.query(`DELETE FROM yozo.logindetail WHERE adhaar = '${u.adhaar}'`).catch(()=>null);
        await sequelize.query(`
          INSERT INTO yozo.logindetail ("name", "adhaar", "password", "role") 
          VALUES ('${u.name}', '${u.adhaar}', '${u.password}', '${u.role}')
        `);
        console.log(`Created ${u.role}: Username (adhaar) = ${u.adhaar}, Password = admin123`);
      }
      process.exit(0);
    } catch(e) {
      console.error(e);
      process.exit(1);
    }
  }
}

seed();

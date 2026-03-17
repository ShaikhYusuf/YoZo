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
    const schema = 'tenanta';

    console.log(`Ensuring schema and tables exist in: ${schema}...`);

    // Create Schema
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`).catch(()=>null);

    // Create School Table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.school (
        "Id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "address" VARCHAR(255) NOT NULL
      )
    `);

    // Create Standard Table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.standard (
        "Id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL
      )
    `);

    // Create Student Table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.student (
        "Id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "adhaar" VARCHAR(255) NOT NULL,
        "school" INTEGER REFERENCES ${schema}.school("Id"),
        "standard" INTEGER REFERENCES ${schema}.standard("Id")
      )
    `);

    // 1. Seed School
    await sequelize.query(`DELETE FROM ${schema}.school WHERE "Id" = 1`).catch(()=>null);
    await sequelize.query(`
      INSERT INTO ${schema}.school ("Id", "name", "address") 
      VALUES (1, 'Demo School', '123 Education Lane')
    `);
    console.log('Created School: Id=1');

    // 2. Seed Standard
    await sequelize.query(`DELETE FROM ${schema}.standard WHERE "Id" = 1`).catch(()=>null);
    await sequelize.query(`
      INSERT INTO ${schema}.standard ("Id", "name") 
      VALUES (1, 'Grade 10')
    `);
    console.log('Created Standard: Id=1');

    // 3. Seed LoginDetails
    const users = [
      { name: 'Admin User', adhaar: 'admin', password: hash, role: 'admin' },
      { name: 'Principal Demo', adhaar: 'principal', password: hash, role: 'principal' },
      { name: 'Teacher Demo', adhaar: 'teacher', password: hash, role: 'teacher' },
      { name: 'Student Demo', adhaar: 'student', password: hash, role: 'student' }
    ];

    for (const u of users) {
      await sequelize.query(`DELETE FROM ${schema}.logindetail WHERE adhaar = '${u.adhaar}'`).catch(()=>null);
      await sequelize.query(`
        INSERT INTO ${schema}.logindetail ("name", "adhaar", "password", "role") 
        VALUES ('${u.name}', '${u.adhaar}', '${u.password}', '${u.role}')
      `);
      console.log(`Created LoginDetail for ${u.role}: Username (adhaar) = ${u.adhaar}`);
    }

    // 4. Seed Student record for the student login
    await sequelize.query(`DELETE FROM ${schema}.student WHERE adhaar = 'student'`).catch(()=>null);
    await sequelize.query(`
      INSERT INTO ${schema}.student ("name", "adhaar", "school", "standard") 
      VALUES ('Student Demo', 'student', 1, 1)
    `);
    console.log('Created Student profile for adhaar="student"');

    console.log('\nAll demo logins and database relations now functional with password: admin123');
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:");
    console.error(error);
    process.exit(1);
  }
}

seed();

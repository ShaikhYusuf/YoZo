const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

async function seed() {
  const sequelize = new Sequelize('postgresql://postgres:postgres@localhost:5432/yozo', {
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('--- Connected to PostgreSQL ---');

    // 1. Clean up redundant tables in 'public' schema
    const redundantTables = [
      'users', 'students', 'schools', 'standards', 'subjects', 
      'lessons', 'lesson_sections', 'progress', 'user_gamification', 
      'school_standards', 'user_badges', 'user_activity_log',
      'lesson_hierarchy'
    ];

    console.log('Cleaning up redundant tables from public schema...');
    for (const table of redundantTables) {
      await sequelize.query(`DROP TABLE IF EXISTS public."${table}" CASCADE`).catch(e => console.log(`Could not drop public.${table}: ${e.message}`));
    }

    const schemaName = 'tenanta';
    await sequelize.createSchema(schemaName).catch(() => {});

    // 3. Drop tables in correct order to avoid constraint errors and ensure schema is fresh
    console.log(`Dropping existing tables in ${schemaName} to ensure schema updates...`);
    await sequelize.query(`DROP TABLE IF EXISTS ${schemaName}.gamification CASCADE`);
    await sequelize.query(`DROP TABLE IF EXISTS ${schemaName}.progress CASCADE`);
    await sequelize.query(`DROP TABLE IF EXISTS ${schemaName}.lessonsection CASCADE`);
    await sequelize.query(`DROP TABLE IF EXISTS ${schemaName}.lesson CASCADE`);
    await sequelize.query(`DROP TABLE IF EXISTS ${schemaName}.subject CASCADE`);
    await sequelize.query(`DROP TABLE IF EXISTS ${schemaName}.student CASCADE`);
    await sequelize.query(`DROP TABLE IF EXISTS ${schemaName}.schoolstandard CASCADE`);
    await sequelize.query(`DROP TABLE IF EXISTS ${schemaName}.school CASCADE`);
    await sequelize.query(`DROP TABLE IF EXISTS ${schemaName}.standard CASCADE`);
    await sequelize.query(`DROP TABLE IF EXISTS ${schemaName}.logindetail CASCADE`);

    // 3.1 Recreate essential tables with new schema
    console.log(`Recreating tables in ${schemaName}...`);
    await sequelize.query(`
      CREATE TABLE ${schemaName}.logindetail (
        "Id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "username" VARCHAR(255) NOT NULL,
        "password" VARCHAR(255) NOT NULL,
        "role" VARCHAR(255) NOT NULL
      )
    `);

    await sequelize.query(`
      CREATE TABLE ${schemaName}.school (
        "Id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "address" TEXT
      )
    `);

    await sequelize.query(`
      CREATE TABLE ${schemaName}.standard (
        "Id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL
      )
    `);

    await sequelize.query(`
      CREATE TABLE ${schemaName}.schoolstandard (
        "Id" SERIAL PRIMARY KEY,
        "school" INTEGER NOT NULL REFERENCES ${schemaName}.school("Id"),
        "standard" INTEGER NOT NULL REFERENCES ${schemaName}.standard("Id")
      )
    `);

    await sequelize.query(`
      CREATE TABLE ${schemaName}.student (
        "Id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "username" VARCHAR(255) NOT NULL,
        "school" INTEGER REFERENCES ${schemaName}.school("Id"),
        "standard" INTEGER REFERENCES ${schemaName}.standard("Id")
      )
    `);

    await sequelize.query(`
      CREATE TABLE ${schemaName}.subject (
        "Id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "standard" INTEGER NOT NULL REFERENCES ${schemaName}.standard("Id")
      )
    `);

    await sequelize.query(`
      CREATE TABLE ${schemaName}.lesson (
        "Id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "subject" INTEGER NOT NULL REFERENCES ${schemaName}.subject("Id")
      )
    `);

    await sequelize.query(`
      CREATE TABLE ${schemaName}.lessonsection (
        "Id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "explanation" TEXT NOT NULL,
        "quiz" TEXT NOT NULL,
        "fillblanks" TEXT NOT NULL,
        "truefalse" TEXT NOT NULL,
        "subject" INTEGER NOT NULL REFERENCES ${schemaName}.subject("Id"),
        "lesson" INTEGER NOT NULL REFERENCES ${schemaName}.lesson("Id")
      )
    `);

    await sequelize.query(`
      CREATE TABLE ${schemaName}.progress (
        "Id" SERIAL PRIMARY KEY,
        "quiz" INTEGER NOT NULL DEFAULT 0,
        "fillblanks" INTEGER NOT NULL DEFAULT 0,
        "truefalse" INTEGER NOT NULL DEFAULT 0,
        "school" INTEGER NOT NULL REFERENCES ${schemaName}.school("Id"),
        "standard" INTEGER NOT NULL REFERENCES ${schemaName}.standard("Id"),
        "student" INTEGER NOT NULL REFERENCES ${schemaName}.student("Id"),
        "subject" INTEGER REFERENCES ${schemaName}.subject("Id"),
        "lesson" INTEGER REFERENCES ${schemaName}.lesson("Id"),
        "lessonsection" INTEGER REFERENCES ${schemaName}.lessonsection("Id")
      )
    `);

    await sequelize.query(`
      CREATE TABLE ${schemaName}.gamification (
        "Id" SERIAL PRIMARY KEY,
        "studentId" INTEGER NOT NULL REFERENCES ${schemaName}.student("Id"),
        "xp" INTEGER DEFAULT 0,
        "level" INTEGER DEFAULT 1,
        "badges" JSON DEFAULT '[]',
        "streakDays" INTEGER DEFAULT 0,
        "lastActive" TIMESTAMP
      )
    `);

    // 4. Seed base data: School, Standard, Subject, Lesson
    console.log('Seeding school, standard, and curriculum...');
    const [schoolRes] = await sequelize.query(`
      INSERT INTO ${schemaName}.school ("name", "address")
      VALUES ('YoZo International School', '123 Education St')
      RETURNING "Id"
    `);
    const schoolId = schoolRes[0].Id;

    const [stdRes] = await sequelize.query(`
      INSERT INTO ${schemaName}.standard ("name")
      VALUES ('Grade 10')
      RETURNING "Id"
    `);
    const stdId = stdRes[0].Id;

    await sequelize.query(`
      INSERT INTO ${schemaName}.schoolstandard ("school", "standard")
      VALUES ($1, $2)
    `, { bind: [schoolId, stdId] });

    const [subRes] = await sequelize.query(`
      INSERT INTO ${schemaName}.subject ("name", "standard")
      VALUES ('Mathematics', $1)
      RETURNING "Id"
    `, { bind: [stdId] });
    const subId = subRes[0].Id;

    const [lessonRes] = await sequelize.query(`
      INSERT INTO ${schemaName}.lesson ("name", "subject")
      VALUES ('Algebra', $1)
      RETURNING "Id"
    `, { bind: [subId] });
    const lessonId = lessonRes[0].Id;

    await sequelize.query(`
      INSERT INTO ${schemaName}.lessonsection ("name", "explanation", "quiz", "fillblanks", "truefalse", "subject", "lesson")
      VALUES ('Introduction to Variables', 'Variables represent unknown quantities.', '[]', '[]', '[]', $1, $2)
    `, { bind: [subId, lessonId] });

    // 5. Seed exactly 4 users and the student profile
    const passwordHash = await bcrypt.hash('password123', 10);
    const users = [
      { name: 'Admin User', username: 'admin', role: 'admin' },
      { name: 'Principal User', username: 'principal', role: 'principal' },
      { name: 'Teacher User', username: 'teacher', role: 'teacher' },
      { name: 'Student User', username: 'student', role: 'student' }
    ];

    console.log('Seeding roles and profiles...');
    for (const u of users) {
      await sequelize.query(`
        INSERT INTO ${schemaName}.logindetail ("name", "username", "password", "role")
        VALUES ($1, $2, $3, $4)
      `, {
        bind: [u.name, u.username, passwordHash, u.role]
      });

      if (u.role === 'student') {
        const [studentRes] = await sequelize.query(`
          INSERT INTO ${schemaName}.student ("name", "username", "school", "standard")
          VALUES ($1, $2, $3, $4)
          RETURNING "Id"
        `, {
          bind: [u.name, u.username, schoolId, stdId]
        });
        const studentId = studentRes[0].Id;

        // Seed initial gamification for student to prevent 500 error if service doesn't create it
        await sequelize.query(`
          INSERT INTO ${schemaName}.gamification ("studentId", "xp", "level", "badges", "streakDays", "lastActive")
          VALUES ($1, 0, 1, '[]', 0, NOW())
        `, { bind: [studentId] });

        console.log(` - Seeded: ${u.role} (${u.username}) with profile loaded in school ID ${schoolId}`);
      } else {
        console.log(` - Seeded: ${u.role} (${u.username})`);
      }
    }

    console.log('\nSUCCESS: Database optimized and users seeded.');
    console.log('Credentials: password123 for all users.');
    process.exit(0);
  } catch (error) {
    console.error('FAILED:', error);
    process.exit(1);
  }
}

seed();

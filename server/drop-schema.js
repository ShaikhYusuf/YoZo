const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('yozo', 'postgres', 'postgres', {
  host: 'localhost',
  dialect: 'postgres',
});
sequelize.query('DROP SCHEMA IF EXISTS yozo CASCADE; CREATE SCHEMA yozo;').then(() => {
  console.log("Schema yozo dropped and recreated");
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});

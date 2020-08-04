const Sequelize = require('sequelize');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:1@localhost:5432/bank';
const db = new Sequelize(connectionString);
module.exports = db;
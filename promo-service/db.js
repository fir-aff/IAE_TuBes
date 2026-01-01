const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Promo Service: Terhubung ke Database PostgreSQL (${process.env.DB_HOST})`);
    // Sync table otomatis agar data tersimpan permanen
    await sequelize.sync({ alter: true });
  } catch (err) {
    console.error('❌ Promo Service: Gagal koneksi ke Database:', err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
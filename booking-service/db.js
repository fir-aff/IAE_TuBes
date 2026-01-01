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
    console.log(`✅ Connected to PostgreSQL: ${process.env.DB_NAME}`);
    // Sync tabel otomatis (Sesuai spesifikasi modular) [cite: 5]
    await sequelize.sync({ alter: true });
  } catch (err) {
    console.error('❌ DB Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
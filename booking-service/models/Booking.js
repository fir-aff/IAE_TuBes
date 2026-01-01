// booking-service/models/Booking.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Booking = sequelize.define('Booking', {
  userId: { // Kunci asing ke User (tapi kita simpan ID saja karena microservice)
    type: DataTypes.INTEGER,
    allowNull: false
  },
  flightScheduleId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  passengerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'BOOKED'
  }
});

module.exports = Booking;
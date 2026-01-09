const { ApolloServer, gql } = require('apollo-server');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const axios = require('axios');
const { connectDB, sequelize } = require('./db');
const Booking = require('./models/Booking');

// Update Database Structure (Alter Table)
connectDB().then(async () => {
  // Opsi { alter: true } akan otomatis menambah kolom baru (hotelName) ke tabel yang sudah ada
  await sequelize.sync({ alter: true });
});

// Flight Schedule Service dari Kelompok 1 (TUBES js v2)
const KELOMPOK1_FLIGHT_SCHEDULE_SERVICE = process.env.KELOMPOK1_FLIGHT_SCHEDULE_SERVICE || 'http://host.docker.internal:4002';

const typeDefs = gql`
  type Booking @key(fields: "id") {
    id: ID!
    userId: String
    type: String      # Baru
    hotelName: String # Baru
    flightCode: String
    passengerName: String
    status: String
  }

  extend type Mutation {
    # Kita update mutasi ini supaya flightCode jadi opsional (bisa null kalau booking hotel)
    createBooking(
      type: String, 
      flightCode: String, 
      hotelName: String, 
      passengerName: String!
    ): Booking
    
    updateBookingStatus(id: ID!, status: String!): Booking
  }
  
  extend type Query {
    myBookings: [Booking]
    bookingById(id: ID!): Booking
    # Query untuk mengambil flight schedule dari Kelompok 1
    kelompok1FlightSchedule(flightCode: String!): Kelompok1FlightSchedule
  }

  # Type untuk flight schedule dari Kelompok 1
  type Kelompok1FlightSchedule {
    id: ID!
    flightCode: String!
    departureLocation: String!
    destinationLocation: String!
    departureTime: String!
    arrivalTime: String!
    price: Float!
    availableSeats: Int!
    status: String!
  }
`;

// Helper function untuk mengambil flight schedule dari Kelompok 1
async function getKelompok1FlightSchedule(flightCode) {
  try {
    const response = await axios.post(
      `${KELOMPOK1_FLIGHT_SCHEDULE_SERVICE}`,
      {
        query: `
          query {
            flightByCode(flightCode: "${flightCode}") {
              id
              flightCode
              departureLocation
              destinationLocation
              departureTime
              arrivalTime
              price
              availableSeats
              status
            }
          }
        `
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
    return response.data.data.flightByCode;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Tidak dapat terhubung ke flight schedule service kelompok 1: ${KELOMPOK1_FLIGHT_SCHEDULE_SERVICE}`);
    }
    if (error.code === 'ETIMEDOUT') {
      throw new Error(`Timeout saat memanggil flight schedule service kelompok 1`);
    }
    throw new Error(`Gagal mengambil flight schedule dari kelompok 1: ${error.message}`);
  }
}

const resolvers = {
  Mutation: {
    createBooking: async (_, args, context) => {
      if (!context.userId) throw new Error("Anda harus login!");
      
      // Default type FLIGHT jika tidak diisi
      const type = args.type || 'FLIGHT';

      // Validasi flight schedule dari Kelompok 1 jika flightCode diberikan
      if (args.flightCode && type === 'FLIGHT') {
        try {
          const flightSchedule = await getKelompok1FlightSchedule(args.flightCode);
          
          // Validasi flight schedule
          if (flightSchedule.status !== 'ACTIVE') {
            throw new Error('Flight tidak aktif');
          }
          
          if (flightSchedule.availableSeats < 1) {
            throw new Error('Kursi tidak tersedia');
          }
          
          // Flight schedule valid, lanjutkan create booking
        } catch (error) {
          // Jika error, throw error untuk user
          throw new Error(`Validasi flight schedule gagal: ${error.message}`);
        }
      }

      return await Booking.create({ 
        userId: context.userId,
        type: type,
        flightCode: args.flightCode,
        hotelName: args.hotelName,
        passengerName: args.passengerName,
        status: 'BOOKED' 
      });
    },

    updateBookingStatus: async (_, { id, status }) => {
      const booking = await Booking.findByPk(id);
      if (!booking) throw new Error("Booking tidak ditemukan");
      booking.status = status;
      await booking.save();
      return booking;
    }
  },
  Query: {
    myBookings: async (_, __, context) => {
      if (!context.userId) throw new Error("Unauthorized");
      return await Booking.findAll({ 
        where: { userId: context.userId },
        order: [['createdAt', 'DESC']] // Urutkan dari yang terbaru
      });
    },
    bookingById: async (_, { id }, context) => {
      // Query ini dapat diakses tanpa auth untuk integrasi lintas kelompok
      const booking = await Booking.findByPk(id);
      if (!booking) throw new Error("Booking tidak ditemukan");
      return booking;
    },
    // Query untuk mengambil flight schedule dari Kelompok 1
    kelompok1FlightSchedule: async (_, { flightCode }, context) => {
      if (!context.userId) throw new Error("Unauthorized");
      
      try {
        const flightSchedule = await getKelompok1FlightSchedule(flightCode);
        return {
          id: flightSchedule.id,
          flightCode: flightSchedule.flightCode,
          departureLocation: flightSchedule.departureLocation,
          destinationLocation: flightSchedule.destinationLocation,
          departureTime: flightSchedule.departureTime,
          arrivalTime: flightSchedule.arrivalTime,
          price: flightSchedule.price,
          availableSeats: flightSchedule.availableSeats,
          status: flightSchedule.status
        };
      } catch (error) {
        throw new Error(`Gagal mengambil flight schedule dari kelompok 1: ${error.message}`);
      }
    }
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
  context: ({ req }) => ({ userId: req.headers['user-id'] })
});

server.listen({ port: 4000 }).then(({ url }) => {
  console.log(`🚀 Booking Service ready at ${url}`);
});
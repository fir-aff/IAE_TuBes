// booking-service/index.js
const { ApolloServer, gql } = require('apollo-server');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { connectDB } = require('./db');
const Booking = require('./models/Booking'); // Import Model

connectDB();

const typeDefs = gql`
  type Booking @key(fields: "id") {
    id: ID!
    status: String
    flightCode: String
    passengerName: String
  }

  extend type Mutation {
    createBooking(flightCode: String!, passengerName: String!): Booking
    
    # TAMBAHKAN INI: Mutasi untuk update status
    updateBookingStatus(id: ID!, status: String!): Booking
  }
  
  extend type Query {
    myBookings: [Booking]
  }
`;

const resolvers = {
  Mutation: {
    createBooking: async (_, { flightCode, passengerName }, context) => {
      // ... (kode createBooking yang lama biarkan saja) ...
      if (!context.userId) throw new Error("Anda harus login!");
      return await Booking.create({ userId: context.userId, flightCode, passengerName });
    },

    // TAMBAHKAN INI:
    updateBookingStatus: async (_, { id, status }, context) => {
      // Validasi sederhana
      if (!context.userId) throw new Error("Unauthorized");

      const booking = await Booking.findByPk(id);
      if (!booking) throw new Error("Booking tidak ditemukan");

      // Update status
      booking.status = status;
      await booking.save();
      
      return booking;
    }
  },
  Query: {
    myBookings: async (_, __, context) => {
      if (!context.userId) throw new Error("Unauthorized");
      // READ (Ambil data milik user tersebut saja)
      return await Booking.findAll({ where: { userId: context.userId } });
    }
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
  // Terima userId dari Gateway
  context: ({ req }) => {
    return { userId: req.headers['user-id'] };
  }
});

server.listen({ port: 4000 }).then(({ url }) => {
  console.log(`🚀 Booking Service ready at ${url}`);
});
// booking-service/index.js
const { ApolloServer, gql } = require('apollo-server');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { connectDB } = require('./db');
const Booking = require('./models/Booking');

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
    updateBookingStatus(id: ID!, status: String!): Booking
  }
  
  extend type Query {
    myBookings: [Booking]
  }
`;

const resolvers = {
  Mutation: {
    createBooking: async (_, { flightCode, passengerName }, context) => {
      // Create Booking tetap butuh Login (karena dipanggil user dari frontend)
      if (!context.userId) throw new Error("Anda harus login!");
      
      // Default status saat create adalah BOOKED
      return await Booking.create({ 
        userId: context.userId, 
        flightCode, 
        passengerName,
        status: 'BOOKED' 
      });
    },

    updateBookingStatus: async (_, { id, status }, context) => {
      // --- PERBAIKAN DI SINI ---
      // KITA HAPUS: if (!context.userId) ...
      // Alasannya: Request ini datang dari Payment Service (Server-to-Server), 
      // jadi tidak membawa header 'user-id' milik user.
      
      const booking = await Booking.findByPk(id);
      if (!booking) throw new Error("Booking tidak ditemukan");

      // Update status
      booking.status = status;
      await booking.save();
      
      console.log(`✅ [Booking-Service] Status Booking ID ${id} diubah jadi ${status}`);
      return booking;
    }
  },
  Query: {
    myBookings: async (_, __, context) => {
      if (!context.userId) throw new Error("Unauthorized");
      return await Booking.findAll({ where: { userId: context.userId } });
    }
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
  context: ({ req }) => {
    return { userId: req.headers['user-id'] };
  }
});

server.listen({ port: 4000 }).then(({ url }) => {
  console.log(`🚀 Booking Service ready at ${url}`);
});
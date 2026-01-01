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
    flightScheduleId: String
    passengerName: String
  }

  extend type Mutation {
    createBooking(flightScheduleId: String!, passengerName: String!): Booking
  }
  
  extend type Query {
    myBookings: [Booking]
  }
`;

const resolvers = {
  Mutation: {
    createBooking: async (_, { flightScheduleId, passengerName }, context) => {
      // 1. CEK AUTH: Apakah user login?
      if (!context.userId) {
        throw new Error("Anda harus login untuk melakukan booking!");
      }

      // 2. CREATE (Simpan ke DB)
      const newBooking = await Booking.create({
        userId: context.userId,
        flightScheduleId,
        passengerName
      });

      return newBooking;
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
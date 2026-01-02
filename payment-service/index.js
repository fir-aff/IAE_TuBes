// payment-service/index.js
const { ApolloServer, gql } = require('apollo-server');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { connectDB } = require('./db');
const Payment = require('./models/Payment');

connectDB();

const typeDefs = gql`
  type Payment @key(fields: "id") {
    id: ID!
    bookingId: String
    amount: Int
    status: String
    method: String
  }

  extend type Mutation {
    payBooking(bookingId: String!, amount: Int!, method: String): Payment
  }
`;

const resolvers = {
  Mutation: {
    payBooking: async (_, { bookingId, amount, method }) => {
      // Simpan data pembayaran
      const newPayment = await Payment.create({
        bookingId,
        amount,
        method
      });
      return newPayment;
    }
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers })
});

server.listen({ port: 4000 }).then(({ url }) => {
  console.log(`🚀 Payment Service ready at ${url}`);
});
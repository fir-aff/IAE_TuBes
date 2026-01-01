const { ApolloServer, gql } = require('apollo-server');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { connectDB } = require('./db');

connectDB();

const typeDefs = gql`
  type Payment @key(fields: "id") {
    id: ID!
    bookingId: ID!
    amount: Float!
    method: String
    status: String! # PENDING, SUCCESS, FAILED
  }

  extend type Query {
    payment(id: ID!): Payment
    paymentByBookingId(bookingId: ID!): Payment
  }

  extend type Mutation {
    createPayment(bookingId: ID!, amount: Float!, method: String!): Payment
  }
`;

const resolvers = {
  Query: {
    payment: (_, { id }) => ({ id, bookingId: "b1", amount: 500000, method: "BCA", status: "SUCCESS" }),
    paymentByBookingId: (_, { bookingId }) => ({ id: "p1", bookingId, amount: 500000, method: "BCA", status: "SUCCESS" })
  },
  Mutation: {
    createPayment: (_, { bookingId, amount, method }) => {
      // Logic save DB here
      return { id: "new-pay-id", bookingId, amount, method, status: "PENDING" };
    }
  },
  Payment: {
    __resolveReference(ref) {
      return { id: ref.id, bookingId: "b1", amount: 500000, status: "SUCCESS" };
    }
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers })
});

server.listen({ port: 4000 }).then(({ url }) => {
  console.log(`🚀 Payment Service ready at ${url}`);
});
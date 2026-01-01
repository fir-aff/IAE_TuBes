const { ApolloServer, gql } = require('apollo-server');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { connectDB } = require('./db');

connectDB();

const typeDefs = gql`
  type Promo {
    id: ID!
    code: String!
    discountAmount: Float
    minTransaction: Float
    isValid: Boolean
  }

  extend type Query {
    checkPromo(code: String!): Promo
  }

  extend type Mutation {
    createPromo(code: String!, discount: Float!): Promo
  }
`;

const resolvers = {
  Query: {
    checkPromo: (_, { code }) => {
      // Mock logic: Jika kode "LIBURAN", valid.
      if (code === "LIBURAN") {
        return { id: "pr1", code, discountAmount: 50000, minTransaction: 100000, isValid: true };
      }
      return { id: "null", code, discountAmount: 0, minTransaction: 0, isValid: false };
    }
  },
  Mutation: {
    createPromo: (_, args) => ({ id: "new", ...args, isValid: true })
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers })
});

server.listen({ port: 4000 }).then(({ url }) => {
  console.log(`🚀 Promo Service ready at ${url}`);
});
const { ApolloServer, gql } = require('apollo-server');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const connectDB = require('./db'); // Import koneksi MongoDB

// --- BAGIAN SCHEMA HOTEL ---
const typeDefs = gql`
type Hotel @key(fields: "id") {
    id: ID!
    name: String
    location: String
    pricePerNight: Int  # <--- TAMBAHKAN INI
  }

  extend type Query {
    hotels: [Hotel]
    hotel(id: ID!): Hotel
  }
`;

const resolvers = {
  Query: {
    hotels: () => [{ id: "h1", name: "Hotel Contoh", location: "Bali" }],
  },
  Hotel: {
    __resolveReference(ref) {
      return { id: ref.id };
    }
  }
};
// ---------------------------

// Connect ke MongoDB
connectDB();

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers })
});

server.listen({ port: 4000 }).then(({ url }) => {
  console.log(`🚀 Hotel Service ready at ${url}`);
});
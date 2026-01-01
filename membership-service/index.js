// membership-service/index.js
const { ApolloServer, gql } = require('apollo-server');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { connectDB } = require('./db');
const User = require('./models/User'); // Import Model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

connectDB();

const typeDefs = gql`
  type User @key(fields: "id") {
    id: ID!
    fullName: String
    email: String
    status: String
    points: Int
  }

  type AuthPayload {
    token: String
    user: User
  }

  extend type Query {
    me: User
  }

  extend type Mutation {
    register(fullName: String!, email: String!, password: String!): User
    login(email: String!, password: String!): AuthPayload
  }
`;

const resolvers = {
  Query: {
    // "me" adalah query untuk melihat profil diri sendiri berdasarkan token
    me: async (_, __, context) => {
      if (!context.userId) throw new Error("Unauthorized");
      return await User.findByPk(context.userId);
    }
  },
  Mutation: {
    register: async (_, { fullName, email, password }) => {
      // 1. Hash Password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // 2. Simpan ke Database
      const newUser = await User.create({
        fullName,
        email,
        password: hashedPassword
      });
      
      return newUser;
    },
    login: async (_, { email, password }) => {
      // 1. Cari User
      const user = await User.findOne({ where: { email } });
      if (!user) throw new Error("User tidak ditemukan");

      // 2. Cek Password
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error("Password salah");

      // 3. Buat Token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email }, 
        "RAHASIA_NEGARA", // Harusnya ditaruh di .env
        { expiresIn: '1d' }
      );

      return { token, user };
    }
  },
  User: {
    __resolveReference(ref) {
      return User.findByPk(ref.id);
    }
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
  // Context: Mengambil header userId yang dikirim Gateway (Nanti di Tahap 2)
  context: ({ req }) => {
    const userId = req.headers['user-id'];
    return { userId };
  }
});

server.listen({ port: 4000 }).then(({ url }) => {
  console.log(`🚀 Membership Service ready at ${url}`);
});
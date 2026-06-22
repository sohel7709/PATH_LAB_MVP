const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

module.exports = async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
  process.env.JWT_EXPIRE = '1d';
  process.env.NODE_ENV = 'test';
  global.__MONGOD__ = mongod;
};

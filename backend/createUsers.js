const mongoose = require('mongoose');
const User = require('./src/models/User');
const db = 'mongodb://localhost:27017/pathology-lab-saas'; // Update with your MongoDB connection string

const createUsers = async () => {
  try {
    await mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true });

    const users = [
      {
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: 'SuperAdmin123',
        role: 'super-admin'
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin123',
        role: 'admin',
        lab: '67e93b80e59884640eba15f4' // Lab ID
      },
      {
        name: 'Technician User',
        email: 'technician@example.com',
        password: 'Technician123',
        role: 'technician',
        lab: '67e93b80e59884640eba15f4' // Lab ID
      }
    ];

    for (const userData of users) {
      const user = await User.create(userData);
      console.log('User created:', user);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  }
};

createUsers();

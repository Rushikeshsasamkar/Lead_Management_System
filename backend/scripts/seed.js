const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });
dotenv.config(); // fallback

const User = require('../models/User');
const Lead = require('../models/Lead');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  await User.deleteMany({});
  await Lead.deleteMany({});

  const admin = await User.create({
    name: 'Admin User', email: 'admin@test.com',
    password: 'password123', role: 'admin'
  });
  const manager = await User.create({
    name: 'Manager User', email: 'manager@test.com',
    password: 'password123', role: 'manager'
  });
  const sales = await User.create({
    name: 'Sales User', email: 'sales@test.com',
    password: 'password123', role: 'sales'
  });

  const statuses = ['new', 'contacted', 'qualified', 'won', 'lost'];
  const sources = ['website', 'referral', 'cold', 'social', 'other'];

  const leads = [];
  for (let i = 1; i <= 25; i++) {
    leads.push({
      name: `Lead ${i} - ${['John', 'Jane', 'Bob', 'Alice', 'Tom'][i % 5]} ${['Smith', 'Doe', 'Kumar', 'Sharma', 'Singh'][i % 5]}`,
      phone: `+919876${String(543210 + i)}`,
      email: `lead${i}@example.com`,
      source: sources[i % sources.length],
      status: statuses[i % statuses.length],
      notes: `Sample notes for lead number ${i}`,
      createdBy: i % 3 === 0 ? admin._id : i % 2 === 0 ? manager._id : sales._id,
      assignedTo: i % 4 === 0 ? sales._id : i % 3 === 0 ? manager._id : null
    });
  }

  await Lead.insertMany(leads);

  console.log('Seed complete!');
  console.log('Admin: admin@test.com / password123');
  console.log('Manager: manager@test.com / password123');
  console.log('Sales: sales@test.com / password123');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});

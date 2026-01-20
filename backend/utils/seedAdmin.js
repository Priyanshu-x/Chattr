const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AdminUser = require('../models/AdminUser');
const path = require('path');

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminUsername || !adminPassword) {
            console.error('ADMIN_USERNAME or ADMIN_PASSWORD not found in .env');
            process.exit(1);
        }

        // Check if admin exists
        const existingAdmin = await AdminUser.findOne({ username: adminUsername });

        if (existingAdmin) {
            console.log(`Admin user '${adminUsername}' already exists. Updating password...`);
            existingAdmin.password = adminPassword; // Pre-save hook will hash this
            await existingAdmin.save();
            console.log('Admin password updated successfully');
        } else {
            console.log(`Creating new admin user: ${adminUsername}`);
            const newAdmin = new AdminUser({
                username: adminUsername,
                password: adminPassword,
                role: 'admin'
            });
            await newAdmin.save();
            console.log('Admin user created successfully');
        }

        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();

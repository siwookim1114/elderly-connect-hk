// MongoDB Initialization Script
// This script runs when the MongoDB container first starts

print('========================================');
print('Initializing Elderly Connect Database');
print('========================================');

db = db.getSiblingDB('community_platform');

// Create collections
db.createCollection('users');
db.createCollection('helpposts');
db.createCollection('applications');

print('Collections created: users, helpposts, applications');

// Create indexes for better query performance
db.helpposts.createIndex({ "user_id": 1 });
db.helpposts.createIndex({ "location": 1 });
db.helpposts.createIndex({ "required_skills": 1 });
db.helpposts.createIndex({ "status": 1 });
db.users.createIndex({ "user_id": 1 }, { unique: true });
db.applications.createIndex({ "post_id": 1 });
db.applications.createIndex({ "helper_id": 1 });
db.applications.createIndex({ "status": 1 });

print('Indexes created');

// Insert sample user data
db.users.insertMany([
    {
        user_id: "001",
        name: "John Doe",
        role: "elderly",
        location: "Sham Shui Po",
        interests: [],
        created_at: new Date()
    },
    {
        user_id: "002",
        name: "Jane Smith",
        role: "youth",
        location: "Mong Kok",
        interests: ["helping elderly", "grocery shopping"],
        created_at: new Date()
    }
]);

print('Sample users inserted');

// Insert sample help post 
db.helpposts.insertOne({
    user_id: "001",
    role: "elderly",
    location: "Sham Shui Po",
    text: "Sample help request - can be deleted",
    required_skills: ["general"],
    interests: [],
    status: "open",  // open, matched, completed
    matched_helper_id: null,
    created_at: new Date()
});

print('Sample help post inserted');

print('========================================');
print('Database initialization complete!');
print('========================================');


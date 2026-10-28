const mongoose = require("mongoose");

const DB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/minivscode";

async function migrate() {
  try {
    console.log("Connecting to MongoDB at:", DB_URI);
    await mongoose.connect(DB_URI);

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Count existing accounts matching 'renuka' (case-insensitive, optional trailing whitespace)
    const filter = { username: { $regex: /^renuka\s*$/i } };
    const count = await usersCollection.countDocuments(filter);
    console.log(`Found ${count} account(s) with username matching 'renuka'.`);

    if (count > 0) {
      // Safely update username to "Neha Kale" while preserving hashed passwords and IDs
      const result = await usersCollection.updateMany(filter, {
        $set: { username: "Neha Kale" },
      });
      console.log(`Successfully updated ${result.modifiedCount} user record(s) to 'Neha Kale'.`);
      console.log("Authentication credentials (hashed passwords) have been fully preserved.");
    } else {
      console.log("No accounts found with username 'renuka'. Database is already up to date.");
    }
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed.");
  }
}

migrate();


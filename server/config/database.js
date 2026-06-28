/**
 * MongoDB Connection
 *
 * Reads MONGODB_URI first, falls back to MONGO_URI for backwards compatibility.
 * Call connectDB() once during server startup.
 */

const mongoose = require("mongoose");
const { sanitizeMongoURI, parseMongoURI } = require("../lib/mongoUtils");

async function connectDB() {
  // Support both MONGODB_URI (Render default) and MONGO_URI (legacy)
  const uri = (process.env.MONGODB_URI || process.env.MONGO_URI || "").trim();

  console.log("\n" + "=".repeat(80));
  console.log("🔍 MONGODB CONNECTION DEBUG");
  console.log("=".repeat(80));
  console.log(`📍 NODE_ENV: ${process.env.NODE_ENV || "not set"}`);
  console.log(`📍 Mongoose Version: ${mongoose.version}`);

  const envKey = process.env.MONGODB_URI
    ? "MONGODB_URI"
    : process.env.MONGO_URI
    ? "MONGO_URI"
    : "NOT FOUND";
  console.log(`Using Mongo URI: ${envKey}`);

  if (!uri) {
    console.error("❌ MONGODB_URI is not configured.");
    console.error("❌ FATAL ERROR: Cannot start server without a MongoDB URI.");
    console.error("📋 Set MONGODB_URI in your Render environment variables.");
    console.log("=".repeat(80) + "\n");
    process.exit(1);
  }

  // Sanitize URI for logging (mask password)
  const sanitizedURI = sanitizeMongoURI(uri);
  console.log(`📍 Sanitized URI: ${sanitizedURI}`);

  // Parse connection components
  const parsed = parseMongoURI(uri);
  if (parsed.error) {
    console.error(`❌ URI parsing error: ${parsed.error}`);
  } else {
    console.log(`📍 Parsed Username: ${parsed.username}`);
    console.log(`📍 Parsed Host: ${parsed.host}`);
    console.log(`📍 Parsed Database: ${parsed.database}`);
  }

  // Validate URI format
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    console.error("❌ MALFORMED URI: Must start with mongodb:// or mongodb+srv://");
    console.error(
      "📋 Expected format: ******cluster.mongodb.net/database?retryWrites=true&w=majority"
    );
    console.error("❌ FATAL ERROR: Invalid MongoDB URI format.");
    console.log("=".repeat(80) + "\n");
    process.exit(1);
  }

  console.log("=".repeat(80) + "\n");

  mongoose.set("strictQuery", true);

  const connectionOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000, // 45 seconds
    family: 4, // Force IPv4
  };

  console.log("Connecting to Mongo...");
  console.log("🔌 Connection options:", JSON.stringify(connectionOptions, null, 2));

  await mongoose.connect(uri, connectionOptions);

  console.log("✅ MongoDB CONNECTED");
  console.log(`📊 Database: ${uri.includes("@") ? uri.split("@")[1] : "local"}`);
}

module.exports = { connectDB };

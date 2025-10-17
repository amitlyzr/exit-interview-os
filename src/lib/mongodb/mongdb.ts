import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MONGODB_URI to .env.local");
}

const MONGODB_URI: string = process.env.MONGODB_URI;

interface ConnectionCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: ConnectionCache;
}

const cached = global.mongoose || { conn: null, promise: null };

if (process.env.NODE_ENV === "development") {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) {
    console.log("MongoDB: Using existing connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("MongoDB: New database connection established");
        return mongoose;
      })
      .catch((error) => {
        console.error("MongoDB: Connection error:", error);

        // Authentication error handling
        if (error.code === 18) {
          console.error(
            "MongoDB: Authentication failed. Please check your username, password, and database permissions."
          );
        }

        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;

    // Connection state monitoring
    mongoose.connection.on("connected", () => {
      console.log("MongoDB: Connected successfully to Content Generator");
    });
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB: Connection error:", err);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB: Connection disconnected");
    });
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

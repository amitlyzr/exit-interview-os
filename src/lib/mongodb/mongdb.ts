/**
 * MongoDB Connection Utility
 * 
 * Manages MongoDB database connections with connection pooling and caching.
 * Uses a singleton pattern to reuse connections across serverless functions,
 * preventing connection exhaustion in Next.js API routes.
 * 
 * @module mongodb
 */

import mongoose from "mongoose";

// Validate environment variable at module load time
if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MONGODB_URI to .env.local");
}

const MONGODB_URI: string = process.env.MONGODB_URI;

/**
 * Connection cache interface for storing mongoose connection and promises
 */
interface ConnectionCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

/**
 * Global mongoose cache to persist across hot reloads in development
 */
declare global {
  var mongoose: ConnectionCache;
}

// Initialize cached connection or use existing global cache
const cached = global.mongoose || { conn: null, promise: null };

// Store cache globally in development to prevent connection churn during hot reload
if (process.env.NODE_ENV === "development") {
  global.mongoose = cached;
}

/**
 * Establishes connection to MongoDB database
 * 
 * Implements connection pooling and caching to optimize performance
 * in serverless environments. Reuses existing connections when available.
 * 
 * Connection options:
 * - bufferCommands: Disabled to fail fast if connection is unavailable
 * - maxPoolSize: Maximum 10 concurrent connections in the pool
 * - serverSelectionTimeoutMS: 5 second timeout for finding available server
 * - socketTimeoutMS: 45 second timeout for socket operations
 * 
 * @returns {Promise<typeof mongoose>} Connected mongoose instance
 * @throws {Error} If connection fails or authentication is invalid
 * 
 * @example
 * ```typescript
 * import connectDB from '@/lib/mongodb/mongdb';
 * 
 * async function handler() {
 *   await connectDB();
 *   // Now you can use mongoose models
 * }
 * ```
 */
async function connectDB() {
  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection promise if one doesn't exist
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
        return mongoose;
      })
      .catch((error) => {
        // Handle authentication errors specifically
        if (error.code === 18) {
          console.error(
            "MongoDB: Authentication failed. Please check your username, password, and database permissions."
          );
        }

        // Clear cached promise on error to allow retry
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;

    // Set up connection event listeners for monitoring
    mongoose.connection.on("connected", () => {
      if (process.env.NODE_ENV === "development") {
        console.log("MongoDB: Connection established successfully");
      }
    });
    
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB: Connection error:", err);
    });
    
    mongoose.connection.on("disconnected", () => {
      if (process.env.NODE_ENV === "development") {
        console.warn("MongoDB: Connection disconnected");
      }
    });
  } catch (e) {
    // Clear cached promise on failure to allow retry
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

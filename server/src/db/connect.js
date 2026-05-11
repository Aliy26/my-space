import mongoose from 'mongoose'

// async because connecting to MongoDB takes time — the server must wait before accepting requests
export async function connectToDatabase(mongodbUri) {
  // No safe fallback for a missing DB URL — crash early rather than run broken
  if (!mongodbUri) {
    throw new Error('MONGODB_URI is required. Add it to server/.env before starting the API.')
  }

  // Silently ignore unknown fields in queries instead of throwing errors
  mongoose.set('strictQuery', true)

  // Actual network connection to MongoDB Atlas — await means nothing runs until this finishes
  await mongoose.connect(mongodbUri)
}

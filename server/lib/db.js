import mongoose from 'mongoose';

// Connect to MongoDB
export const connectDB = async ()=>{
    try {
        mongoose.connection.on("connected",()=> console.log("Database connected successfully"));
        await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`)
    } catch (error) {
        console.log("Database connection error: ", error.message);        
    }
}
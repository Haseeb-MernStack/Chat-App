import User from "../models/User.js";
import jwt from "jsonwebtoken";


// Middleware to protect routes
export const protectRoute = async (req, res, next) => {
    try {
        const token = req.headers.token;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({
                message: "Not authorized, user not found",
                success: false
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Not authorized, token failed",
            success: false,
            error: error.message
        });        
    }
}
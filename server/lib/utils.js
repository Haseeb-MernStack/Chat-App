import jwt from "jsonwebtoken";

// Generate JWT Token
export const generateToken = (userId)=>{
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: '7d'});
    return token;
}
import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";


// Signup a new user
export const signup = async (req, res) => {
    const { fullName, email, password, bio } = req.body;

    try {
        if (!fullName || !email || !password || !bio) {
            return res.status(400).json({
                message: "All fields are required",
                success: false
            });
        }
        const user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({
                message: "User already exists",
                success: false
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User.create({
            fullName,
            email,
            password: hashedPassword,
            bio
        });

        const token = generateToken(newUser._id);

        res.status(201).json({
            message: "User created successfully",
            success: true,
            data: {
                user: newUser,
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            success: false,
            error: error.message
        });
    }
}

// Login an existing user
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "User does not exist",
                success: false
            });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials",
                success: false
            });
        }
        const token = generateToken(user._id);
        res.status(200).json({
            message: "User logged in successfully",
            success: true,
            data: {
                user,
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            success: false,
            error: error.message
        });
    }
}

// controller to check if user is authenticated
export const checkAuth = (req, res) => {
    res.status(200).json({
        message: "User is authenticated",
        success: true,
        user: req.user
    })
}

// controller to update user profile details
export const updateProfile = async (req, res) => {
    try {
        const { fullName, bio, profilePic } = req.body;

        const userId = req.user._id;
        let updatedUser;

        if (!profilePic) {
            updatedUser = await User.findByIdAndUpdate(userId, { fullName, bio }, { new: true });
        } else {
            const upload = await cloudinary.uploader.upload(profilePic);

            updatedUser = await User.findByIdAndUpdate(userId, { profilePic: upload.secure_url, fullName, bio }, { new: true });
        }
        res.status(200).json({
            message: "Profile updated successfully",
            success: true,
            data: updatedUser
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            success: false,
            error: error.message
        });
    }
}
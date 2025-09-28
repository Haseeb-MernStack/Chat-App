import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import {io, userSocketMap} from "../server.js";

// get all users except logged in user
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({
            _id: { $ne: userId }
        }).select("-password");

        //  count number of messages not seen.
        const unseenMessages = {}
        const promises = filteredUsers.map(async (user) => {
            const messages = await Message.find({
                senderId: user._id,
                receiverId: userId,
                seen: false
            })
            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises);
        res.status(200).json({
            message: "Users fetched successfully",
            success: true,
            users: filteredUsers,
            unseenMessages
        })
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            success: false,
            error: error.message
        })
    }
}

// get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ]
        })
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true });

        res.status(200).json({
            message: "Messages fetched successfully",
            success: true,
            messages
        })

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            success: false,
            error: error.message
        })
    }
}

// api to mark message as seen using message id.
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true });
        res.status(200).json({
            message: "Message marked as seen",
            success: true,
        })
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            success: false,
            error: error.message
        })
    }
}

// send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;

        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        })

        // emit the new message to the receiver's socket
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(200).json({
            message: "Message sent successfully",
            success: true,
            newMessage
        })
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            success: false,
            error: error.message
        })
    }
}
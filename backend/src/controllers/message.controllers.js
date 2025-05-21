import { User } from "../model/user.model.js"
import { Message } from '../model/message.model.js'
import cloudinary from '../lib/cloudinary.js'
import { getReceiverSocketId, io } from "../lib/socket.js"



export const getUserForSidebar = async(req,res) => {
    try {
        const loggedInUserId = req.user._id
        const filteredUsers = await User.find({_id: {$ne: loggedInUserId}}).select("-password")
    
        return res.status(201).json(filteredUsers)
    } catch (error) {
        console.log("error in getUSerForSidebar", error)
        return res.status(500).json({message: "Internal server error"})
    }
}

export const getMessages = async (req,res) => {
    try {
        const {id:userToChatId} = req.params // here we have rename the id to userToChatId
        const myId = req.user._id

        const messages = await Message.find({
            $or: [
                {senderId:myId, receiverId:userToChatId},
                {senderId:userToChatId, receiverId:myId}
            ]
        })

        return res.status(200).json(messages)
    } catch (error) {
        console.log("error in getMessage controller", error)
        return res.status(500).json({message: "Internal server error"})
    }
}

export const sendMessage = async (req,res) => {
    try {
        const {text , image} = req.body
        const {id: receiverId} = req.params
        const senderId = req.user._id

        let imageUrl
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        })

        await newMessage.save()

        // realtime functionality goes here
        const receiverSocketId = getReceiverSocketId(receiverId)
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        res.status(201).json(newMessage)

    } catch (error) {
        console.log("error in newMessage controller", error)
        res.status(500).json({message: "Internal server error"})
    }
}
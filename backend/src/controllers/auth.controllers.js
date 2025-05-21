import { generateToken } from '../lib/utils.js'
import {User} from '../model/user.model.js'
import bcrypt from 'bcryptjs'
import cloudinary from '../lib/cloudinary.js'

export const signup = async (req,res)=>{

    const {fullName, password, email} = req.body

    try {
        if(!fullName || !email || !password){
            return res.status(400).json({message: "All fields are required"})
        }

        if (password.length < 6){
            return res.status(400).json({message: "Password must be atleast 6 characters"})
        }

        const user = await User.findOne({email})
        if(user){
            return res.status(400).json({message: "Email already exist"})
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,

        })

        if(newUser){
            generateToken(newUser._id, res)
            await newUser.save();
            res.status(201).json({messgae: "User created successfully"})

            console.log("hello")
        }
        else{
            return res.status(400).json({messgae: "Invalid User data!"})
        }

    } catch (error) {
        console.log("error in signup controller", error)
        res.status(500).json({ message: "Internal server error" })
    }
}

export const login = async (req,res)=>{

    const {email,password} = req.body

    try {
        const user = await User.findOne({email})
        if(!user){
            return res.status(400).json({message: "Invalid credentials"})
        }

        const isPasswordCorrect = await bcrypt.compare(password,user.password)
        if(!isPasswordCorrect){
            return res.status(400).json({message: "Invalid credentials"})
        }

        generateToken(user._id,res)
        return res.status(201).json({
            _id:user._id,
            fullName:user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        })
    } catch (error) {
        res.status(500).json({message: "Internal server error!"})
    }
}

export const logout = (req,res)=>{
    try {
        res.cookie("jwt","",{maxAge:0})
        res.status(201).json({message: "Logout successfully"})
    } catch (error) {
        console.log("Error in Logout controller", error)
        res.status(500).json({message: "Internal Server Error"})
    }
}

export const updateProfile = async (req,res) => {
    try {
        const {profilePic} = req.body
        const userId = req.user._id

        if(!profilePic){
            return res.status(400).json({message: "Profile picture is required"})
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic)
        const updateUser = await User.findByIdAndUpdate(
            userId, 
            {profilePic: uploadResponse.secure_url}, 
            {new: true}, // without this line it will give us the user before update but with this it will give us the user after the updates 
        )

        res.status(201).json(updateUser)

    } catch (error) {
        console.log('error in update profilePic', error)
        res.status(500).json({message: 'Internal server error!'})
    }
}

export const checkAuth = (req,res) => {
    try {
        return res.status(201).json(req.user)
    } catch (error) {
        console.log('error in checkAuth controller', error)
        return res.status(500).json({message: 'Internal server error!'})
    }
}
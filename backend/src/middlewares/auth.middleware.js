import jwt from 'jsonwebtoken'
import {User} from '../model/user.model.js'

export const protectRoute = async (req,res,next)=>{
    try {
        const token = req.cookies.jwt
        if(!token){
            return res.status(400).json({message: "Unauthorized: No token provided"})
        }
    
        const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY)
    
        const user = await User.findById(decoded.userId).select("-password");
        if(!user){
            return res.status(404).json({message: "User Not Found"})
        }
    
        req.user = user
        next()

    } catch (error) {
        console.log("error in protectRoute middleware : ", error)
        return res.status(500).json({message: "Internal server error"})
    }
}

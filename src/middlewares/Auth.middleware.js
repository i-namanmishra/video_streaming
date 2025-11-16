import { User } from "../models/user.models";
import { apiErrors } from "../utils/apiErrors";
import { asyncHandlers } from "../utils/asyncHandlers";
import jwt from "jsonwebtoken";
export const verifyJWT=asyncHandlers(async(req,res,next)=>{
    try {
        const token=req.cookies?.accessToken|| req.headers("Authorization")?.replace("Bearer","")
    
        if(!token){
            throw new apiErrors("Access token is missing",401);
        }
        
        jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decodedToken?._id).select("-password -refreshTokens");
        if(!user){
            throw new apiErrors("User not found",404);
        }
    
        req.user=user;
        next();
    } catch (error) {
        throw new apiErrors("Invalid or expired token",401);
    }
});
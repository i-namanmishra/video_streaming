import { use } from "react";
import { User } from "../models/user.models.js";
import { apiErrors } from "../utils/apiErrors.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandlers } from "../utils/asyncHandlers.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const generateAccessTokenAndRefreshToken = async(userId) => {
    try {
        const user=await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken=refreshToken;
        await user.save({
            validateBeforeSave: false,
        })
        return { accessToken, refreshToken };
    } catch (error) {
        throw new apiErrors("Token generation failed", 500);
    }
}
const registerUser = asyncHandlers(async (req, res) => {
    const{fullName,email,userName,password}=req.body;
    console.log(email);

    if(
        [fullName,email,userName,password].some((field)=>field?.trim()==="")
    ){
        throw new apiErrors("All fields are required",400);
    }

    const existingUser =await User.findOne({
        $or: [{ email }, { userName }],
    })

    if (existingUser) {
        throw new apiErrors("User with given email or username already exists", 409);
    }
    
    const avtarLocalPath = req.file?.avtar[0]?.path;
    const coverImageLocalPath = req.file?.coverImage[0]?.path;

    if(!avtarLocalPath){
        throw new apiErrors("Avtar and Cover Image are required",400);
    }
    const avtar =await uploadToCloudinary(avtarLocalPath);
    const coverImage=await uploadToCloudinary(coverImageLocalPath);

    if(!avtar){
        throw new apiErrors("Image upload failed",500);
    }

    const user =await User.create({
        fullName,
        avtar:avtar.url,
        coverImage:coverImage.url,
        email,
        userName:userName.toLowerCase(),
        password,
    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
        throw new apiErrors("User creation failed",500);
    }
    res.status(201).json(
        new apiResponse(201,"User registered successfully",createdUser)
    );
});
 const loginUser = asyncHandlers(async (req, res) => {
        const{email,password,userName}=req.body;

        if(!email || !password){
            throw new apiErrors("Email and Password are required",400);
        }
        const user=await User.findOne({
            $or:[{userName},{email}]
        })

        if(!user){
            throw new apiErrors("Invalid credentials",401);
        }

        const isPasswordValid=await user.isPasswordCorrect(password);

        if(!isPasswordValid){
            throw new apiErrors("Invalid credentials",401);
        }

        const{accessToken,refreshToken}=await generateAccessTokenAndRefreshToken(user._id);

        const loggedInUser=await User.findById(user._id).select("-password -refreshTokens");

        const option={
            httpOnly:true,
            secure:true
        }

        return res.status(200)
        .cookie("accessToken",accessToken,option)
        .cookie("refreshToken",refreshToken,option)
        .json(
            new apiResponse(
                200,{
                    user:loggedInUser,accessToken,refreshToken
                }
            ,"User logged in successfully")
        );
    });

    const logoutUser = asyncHandlers(async(req,res)=>{
        await User.findByIdAndUpdate(req.user._id,
            {
                $set:{
                    refreshToken:undefined
                }
            },
            {
                new:true    
            }
        );

        const option={
            httpOnly:true,
            secure:true,
        }

        return res
        .status(200)
        .clearCookie("accessToken",option)
        .clearCookie("refreshToken",option)
        .json(
            new apiResponse(200,"User logged out successfully")
        );
    });
    const refreshAccessToken = asyncHandlers(async(req,res)=>{
        const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;

        if(!incomingRefreshToken){
            throw new apiErrors("Refresh token is missing",401);
        }

        try {
            const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
            const user=await User.findById(decodedToken?._id);
            if(!user){
                throw new apiErrors("Invalid refresh token",403);
            }
    
            if(user.refreshToken !== incomingRefreshToken){
                throw new apiErrors("Refresh token mismatch",403);
            }
            const options={
                httpOnly:true,
                secure:true,
            }
            const {accessToken,refreshToken}=await generateAccessTokenAndRefreshToken(user._id);
    
            return res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",refreshToken,options)
            .json(
                new apiResponse(
                    200,{
                        accessToken,
                        refreshToken
                    },
                    "Access token refreshed successfully"
                )
            );
        } catch (error) {
            throw new apiErrors("Invalid or expired refresh token",403);
        }
    });

    const changeCurrentPassword = asyncHandlers(async(req,res)=>{
        const{oldPassword,newPassword}=req.body;
        const user=await User.findById(req.user._id);
        const isPasswordValid=await user.isPasswordCorrect(oldPassword);

        if(!isPasswordValid){
            throw new apiErrors("Old password is incorrect",400);
        }
        user.password=newPassword;
        user.save({validateBeforeSave:false});

        return res
        .status(200)
        .json(
            new apiResponse(200,"Password changed successfully")
        );
    }
);

const getCurrentUser= asyncHandlers(async(req,res)=> {
    return res
    .status(200)
    .json(
        new apiResponse(200,"Current user fetched successfully",req.user)
    );
}
);

const accountUpdateDetails= asyncHandlers(async(req,res)=>{
    const{fullName,email}=req.body;
    if(!fullName || !email){
        throw new apiErrors("All fields are required",400);
    }
    const user=User.findByIdAndUpdate(
        req.user?.id,
        {
            $set:{
                fullName:fullName,
                email:email,
            }
        },
        { new:true}
    ).select("-password");

    return res
    .status(200)
    .json(
        new apiResponse(200,"User details updated successfully",user)
    );  

});

const updateUserAvatar= asyncHandlers(async(req,res)=>{
    const avtarLocalPath=req.file?.path;
    if(!avtarLocalPath){
        throw new apiErrors("Avtar image is required",400);
    }   

    const avatar=await uploadToCloudinary(avtarLocalPath)

    if(!avatar.url){
        throw new apiErrors("Image upload failed",500);
    }
    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avtar:avatar.url,
            }
        },
        {new:true}
    ).select("-password");
    return res
    .status(200)
    .json(
        new apiResponse(200,"User avtar updated successfully",{avtar:avatar.url})
    );
});

const updateCoverImage= asyncHandlers(async(req,res)=>{
    const coverImageLocalPath=req.file?.path;
    if(!coverImageLocalPath){
        throw new apiErrors("Cover image is required",400);
    }   
    const coverImage=await uploadToCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new apiErrors("Image upload failed",500);
    }           
    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage:coverImage.url,
            }   
        },
        {new:true}
    ).select("-password");
    return res
    .status(200)
    .json(
        new apiResponse(200,"User cover image updated successfully",{coverImage:coverImage.url})
    );
}
);
export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, accountUpdateDetails, updateUserAvatar ,updateCoverImage};
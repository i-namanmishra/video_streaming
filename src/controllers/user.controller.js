import { User } from "../models/user.models.js";
import { apiErrors } from "../utils/apiErrors.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandlers } from "../utils/asyncHandlers.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";


const registerUser = asyncHandlers(async (req, res) => {
    const{fullName,email,userName,password}=req.body;
    console.log(email);

    if(
        [fullName,email,userName,password].some((field)=>field?.trim()==="")
    ){
        throw new apiErrors("All fields are required",400);
    }

    const existingUser = User.findOne({
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
export { registerUser };
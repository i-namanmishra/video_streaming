import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadToCloudinary=async(filePath)=>{
    try{
        if(!filePath) return null;
        const result=await cloudinary.uploader.upload(filePath,{
            resourse_type:"auto",
        });
        console.log("Cloudinary upload result:", result.url);
        fs.unlinkSync(filePath);
        return result;
    }catch(error){
        fs.unlinkSync(filePath);
        console.error("Cloudinary upload error:", error);
        return null;
    }
};

export {uploadToCloudinary};
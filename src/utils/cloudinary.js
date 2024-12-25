import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localPathName) =>{
    try {
        if(!localPathName) return null;

        const response = await cloudinary.uploader.upload(localPathName,{
            resource_type: "auto"
        }) 
        
        fs.unlinkSync(localPathName)
        
        return response;

    } catch (error) {
        fs.unlinkSync(localPathName)
        return null
        
    }

}

export { uploadOnCloudinary }

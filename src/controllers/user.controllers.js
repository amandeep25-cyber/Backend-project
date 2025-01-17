import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const generateAccessTokenAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateAccessToken();

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}
        
    } catch (error) {
        throw new ApiError(500, "Issues in generating access and refresh token")
    }
}

const registerUser = asyncHandler( async (req,res)=>{
    
    // get data from user
    const {fullName,email,username,password} = req.body;
    
    // check for validation - not empty
    if(
        [fullName,email,username,password].some((field)=>
        field?.trim()==="")
    ){
        throw new ApiError(400,"Any field should not be empty"); 
    }

    // check for Existed user
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"User already existed")
    }

    // check for images,check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath ;
    if(
        req.files && Array.isArray(req.files.coverImage) && (req.files.coverImage.length) > 0
    ){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required")
    }
    
    // upload them on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(500 ,"Image Uploading issues on cloudinary")
    }

    // create entry in database
    const user = await User.create({
        fullName,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    if(!createdUser){
        throw new ApiError(500 ,"Something went wrong while creating user")
    }

    // send response to user
    return res.status(201).json(
        new ApiResponse(200 , createdUser)
    )

})

const userLogin = asyncHandler( async (req,res)=>{
    const { username, password, email} = req.body;

    if(!username || !email){
        throw new ApiError(401, "Enter your email and username")
    }
    
    const user = await User.findOne({
        $or: [{email},{username}]
    })

    if(!user){
        throw new ApiError(400, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(402, "Enter valid password")
    }

    const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    const options ={
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )


})

export { 
    registerUser,
    userLogin,
 }
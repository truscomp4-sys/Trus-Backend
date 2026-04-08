import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with hardcoded credentials for now as per instructions
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

export default cloudinary;

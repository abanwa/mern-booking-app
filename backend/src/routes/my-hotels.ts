import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import Hotel, { HotelType } from "../models/hotel";
import verifyToken from "../middleware/auth";
import { body } from "express-validator";

// This file is going to contain a set of API end points
const router = express.Router();

// "npm i multer"
// this will store any image or any file that we get from the post request in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// this endpoint will be api/my-hotels . user can upload up to 6 images at a time
// whenever we receive the Request, nulter will handle the files and it will attach a file object to the Request which we can use in our own function
// Only the logged in user can acess this endpoint or upload something to the hotel table in our database. through the logged in user token that we will get the user id. that is what the verifyToken does
// if the user is logged in, the we will verify the user input using the express-validator we installed using "npm install express-validator"
router.post(
  "/",
  verifyToken,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("city").notEmpty().withMessage("City is required"),
    body("country").notEmpty().withMessage("Country is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("type").notEmpty().withMessage("Hotel type is required"),
    body("pricePerNight")
      .notEmpty()
      .isNumeric()
      .withMessage("Price per night is required"),
    body("facilities")
      .notEmpty()
      .isArray()
      .withMessage("Facilities are required")
  ],
  upload.array("imageFiles", 6),
  async (req: Request, res: Response) => {
    // whenever we are working on a form with images, we should send the data as a multi-part/form object
    // we will install a package that will help us with handling of the images. it is called multer. we will run "npm i multer" and "npm i --save-dev @types/multer"
    // the multer does is that it will take the binary from each field in the request we get and it will give it as an object so that it will be easier to handle

    try {
      // this is how we will get the image files form the post request
      const imageFiles = req.files as Express.Multer.File[];
      // for other form data fields
      const newHotel: HotelType = req.body;

      // 1. upload the images to cloudinary
      // we can only upload one image file to cloudinary at a time
      const uploadPromises = imageFiles.map(async (image) => {
        // encode the image to base64 string
        const b64 = Buffer.from(image.buffer).toString("base64");
        let dataURI = "data:" + image.mimetype + ";base64," + b64;
        // we are using the cloudinary SDK to upload the images 1 at a timet to the cloudinary database and getting the url to the uploaded image/images
        const resp = await cloudinary.v2.uploader.upload(dataURI);
        return resp.url;
      });

      // This will wait for all images to be uploaded before we get bnack a string arraywhich is assigned to the imageUrls variable
      const imageUrls = await Promise.all(uploadPromises);
      // console.log(imageUrls);
      // 2. If the upload was successful, add the URLs to the new hotel
      newHotel.imageUrls = imageUrls;
      newHotel.lastUpdated = new Date();
      newHotel.userId = req.userId;

      // 3. Save the new hotel in our database in the Hotel table
      // the new Hotel references the hotel schema we created in our hotel model.
      const hotel = new Hotel(newHotel);
      await hotel.save();

      // 4. return a 201 status
      res.status(201).send(hotel);
    } catch (err) {
      console.log("Error creating hotel: ", err);
      res.status(500).json({
        message: "Something went wrong"
      });
    }
  }
);

export default router;

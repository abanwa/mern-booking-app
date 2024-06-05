import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import Hotel from "../models/hotel";
import { HotelType } from "../shared/types";
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
      /*
      // we can only upload one image file to cloudinary at a time. THIS WAS HOW WE WROTE IT BEFORE WE CONVERTED IT TO A FUNCTION TO REUSE IN UPDATE HOTEL FUNCTION
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
      */
      const imageUrls = await uploadImages(imageFiles);
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

// THIS WILL GET OUR HOTELS IN OUR DATABASE
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    // we will get the logged in user id via the user token and the user the user id to find all the hotels uploaded by the user. req.userId is coming from the verifyToken after it has been decoded
    const hotels = await Hotel.find({ userId: req.userId });
    // if there are no hotels, the hotel array will be empty
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

// TO GET A SINGLE HOTEL BASE ON THE HOTEL ID
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  // we will get the id of the hotel we want to fetch
  // the id will be gotten from the request URL
  // api/my-hotels/637838992736 the number will be assigned to the :id variable
  // this param.id , the "id" is the /:id we specified above
  const id = req.params.id.toString();
  // the logged in user Id get attached to the request when we are logged in and call the API in the verifyToken
  try {
    const hotel = await Hotel.findOne({
      _id: id,
      userId: req.userId
    });

    res.json(hotel);
  } catch (err) {
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

// THIS IS TO UPDATE THE EDITED HOTEL AFTER WE SUBMIT THE EDITTED HOTEL
// :hotelId is a placeholder for the hotel id we want to edit
router.put(
  "/:hotelId",
  verifyToken,
  upload.array("imageFiles"),
  async (req: Request, res: Response) => {
    try {
      // we will get the form data from the request and save the changes to the hotel document/hotel table in our datbase
      const updatedHotel: HotelType = req.body;
      updatedHotel.lastUpdated = new Date();

      // get the hotel we are updating and save the updated details
      // this param.hotelId , the "hotelId" is the /:hotelId we specified above
      // the {new: true} will make our hotel (const hotel) to have the most updated values when it returns the updated hotel details/data
      const hotel = await Hotel.findOneAndUpdate(
        {
          _id: req.params.hotelId,
          userId: req.userId
        },
        updatedHotel,
        { new: true }
      );

      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      // and we will upload the images we received to cloudinary and save the urls
      // remember we added the upload array stuff to the signature of our endpoint so that mutter will handle the parsing of the Files and add it to the request for us
      // this is the new files the user decides to add whenever they edit the hotel and we will upload it to cloudinary
      const files = req.files as Express.Multer.File[];
      // this uploadImages function we wrote will upload the images to cloudinary and return the array of urls to the uploaded images
      const updatedImageUrls = await uploadImages(files);
      // we will store the image urls to the updated hotel
      hotel.imageUrls = [
        ...updatedImageUrls,
        ...(updatedHotel.imageUrls || [])
      ];

      // we will now save the updated hotel
      await hotel.save();

      res.status(201).json(hotel);
    } catch (err) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

async function uploadImages(imageFiles: Express.Multer.File[]) {
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
  return imageUrls;
}

export default router;

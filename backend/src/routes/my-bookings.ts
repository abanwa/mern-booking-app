import express, { Request, Response } from "express";
import verifyToken from "../middleware/auth";
import Hotel from "../models/hotel";
import { HotelType } from "../shared/types";

const router = express.Router();

// /api/my-bookings
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    // we will search all the hotel data/documents we have  and check the booking array field  and return all the hotels that have a userId as part of booking object  in the booking array field. different bookings from different users can be in the hotel booking array field/column. so, we will get only the hotel records that has the loggedIn userId (req.userId) as part of the booking array field/column
    const hotels = await Hotel.find({
      bookings: { $elemMatch: { userId: req.userId } }
    });

    // Since it will return all the data in the hotel record that matches the userId in the booking array column/field, we will map it to return only the booking array field/column . now, we will loop through the hotel records and filter the booking array to get only the bookings of the logged in user
    const results = hotels.map((hotel) => {
      const userBookings = hotel.bookings.filter(
        (booking) => booking.userId === req.userId
      );

      // we will update the hotel booking array with only the logged in bookings from the booking array field/column
      // hotel.toObject() will convert the mongoose hotel to javascript object
      const hotelWithUserBookings: HotelType = {
        ...hotel.toObject(),
        bookings: userBookings
      };

      return hotelWithUserBookings;
    });

    // we will send the hotel records with the booking array field/column with only the loggedIn user bookings after we had filter out the other users bookings
    res.status(200).send(results);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "unable to fetch bookings" });
  }
});

export default router;

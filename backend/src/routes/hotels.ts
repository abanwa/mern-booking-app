import express, { Request, Response } from "express";
import Hotel, { Booking } from "../models/hotel";
import { BookingType, HotelSearchResponse } from "../shared/types";
import { param, validationResult } from "express-validator";
import Stripe from "stripe";
import verifyToken from "../middleware/auth";

// we used "npm i stripe" to install stripe SDK

// // we used "npm i --save @stripe/react-stripe-js @stripe/stripe-js" to install stripe in the frontend

// we will initialise stripe
const stripe = new Stripe(process.env.STRIPE_API_KEY as string);

const router = express.Router();

// /api/hotels/search?
router.get("/search", async (req: Request, res: Response) => {
  try {
    // req.query is the whole query appended to the search URL. this function help to search base on what we click to search for
    const query = constructSearchQuery(req.query);

    let sortOptions = {};

    // we will check if sortOptions is selected. Remember, sortOption is a single value
    // -1 means sort all the hotels base on the starRating from high to low
    // 1 for pricePerNight means sort the hotel from the lowest price to highest
    // -1 for pricePerNightDesc means sort the hotel from the highest price to lowest price
    switch (req.query.sortOption) {
      case "starRating":
        sortOptions = { starRating: -1 };
        break;
      case "pricePerNightAsc":
        sortOptions = { pricePerNight: 1 };
        break;

      case "pricePerNightDesc":
        sortOptions = { pricePerNight: -1 };
        break;
    }

    // No of data to display per page
    const pageSize = 5;

    // page no we wan tot view
    const pageNumber = parseInt(
      req.query.page ? req.query.page.toString() : "1"
    );

    // pages to skip
    const skip = (pageNumber - 1) * pageSize;

    const hotels = await Hotel.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    // This will give us the total number of records/documents in our Hotel table
    const total = await Hotel.countDocuments();
    // this will get the number of records we searched for or available
    // const totals = hotels.length;
    // const totals = hotels.length;
    // console.log(" total ", total);
    // console.log(" totals ", totals);

    // this HotelSearchResponse is how our response will be like
    const response: HotelSearchResponse = {
      data: hotels,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize)
      }
    };

    res.json(response);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

const constructSearchQuery = (queryParams: any) => {
  let constructedQuery: any = {};

  if (queryParams.destination) {
    constructedQuery.$or = [
      { city: new RegExp(queryParams.destination, "i") },
      { country: new RegExp(queryParams.destination, "i") }
    ];
  }

  if (queryParams.adultCount) {
    constructedQuery.adultCount = {
      $gte: parseInt(queryParams.adultCount)
    };
  }

  if (queryParams.childCount) {
    constructedQuery.childCount = {
      $gte: parseInt(queryParams.childCount)
    };
  }

  // this will get all the hotels that has the facilities we selected
  if (queryParams.facilities) {
    constructedQuery.facilities = {
      $all: Array.isArray(queryParams.facilities)
        ? queryParams.facilities
        : [queryParams.facilities]
    };
  }

  // This will select the hotels that have any of the types in the type property we clicked
  if (queryParams.types) {
    constructedQuery.type = {
      $in: Array.isArray(queryParams.types)
        ? queryParams.types
        : [queryParams.types]
    };
  }

  // this will get all the hotels that has the ratings we clicked/checked for search
  if (queryParams.stars) {
    const starRatings = Array.isArray(queryParams.stars)
      ? queryParams.stars.map((star: string) => parseInt(star))
      : parseInt(queryParams.stars);

    constructedQuery.starRating = {
      $in: starRatings
    };
  }

  // this will get all the hotels that has the price less than or equal the max price we entered or checked
  if (queryParams.maxPrice) {
    constructedQuery.pricePerNight = {
      $lte: parseInt(queryParams.maxPrice).toString()
    };
  }

  return constructedQuery;
};

// We will get the hotel details that the user searched for or tried to book or clicked to view when the user clicked the view details of the search hotel results

// we will use express validator to validate the query params after the "/:id"
router.get(
  "/:id",
  [param("id").notEmpty().withMessage("Hotel ID is required")],
  async (req: Request, res: Response) => {
    // we will check of there is any error when we did our validation using express validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = req.params.id.toString();

    try {
      const hotel = await Hotel.findById(id);
      // if (!hotel) {
      //   return res.status(400).json({ message: "Hotel Not Found via ID" });
      // }

      res.json(hotel);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Error fetching hotel" });
    }
  }
);

// WE WILL CREATE A STRIPE PAYMENT INTENT USING THIS API
router.post(
  "/:hotelId/bookings/payment-intent",
  verifyToken,
  async (req: Request, res: Response) => {
    const { numberOfNights } = req.body;
    // 1. the hotelId we want to book
    const hotelId = req.params.hotelId; // this is gotten from the url // detail/:hotelId/booking

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(400).json({ message: "Hotel not found" });
    }

    // 2. we need to know the total cost of the booking. that ius the total cost of the nights the user wants to book
    const totalCost = hotel.pricePerNight * numberOfNights;

    // we will create our invoice
    // the reason why we add the meta deta is to help us check if booking has been paid for
    // the paymentIntent returns a secret key
    // the amount works in cents. ao we will convert it to dollar by multiplying by 100. if it's naira, we will say, it works in Kobo
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCost * 100,
      currency: "usd",
      metadata: {
        hotelId,
        userId: req.userId
      }
    });

    if (!paymentIntent.client_secret) {
      return res.status(500).json({ message: "Error creating payment intent" });
    }

    // we will define the things we want to send back to the frontend
    // paymentIntentId is used to initialise some element in our frontend
    const response = {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret.toString(),
      totalCost
    };

    res.send(response);
  }
);

// THIS IS THE END POINT WE WILL USE TO INSERT THE HOTEL DATA THE USER BOOKED AFTER PAYMENT INTO THE BOOKING TABLE
router.post(
  "/:hotelId/bookings",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      // we want to check if the stripe payment was successful using the stripe paymentIntentId
      const paymentIntentId = req.body.paymentIntentId;
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId as string
      );

      // if the payment intent wasn't found, return this error message
      if (!paymentIntent) {
        return res.status(400).json({ message: "Payment intent not found" });
      }

      //  we will check if the hotelId and userId we used or added in the meta data when we first create the payment intent matches the hotelId and userId in the request after we have retrieved the payment intent
      // the req.params.hotelId is comming from the URL param while req.userId is coming from the logged in user authentication in the verifyToken function
      if (
        paymentIntent.metadata.hotelId !== req.params.hotelId ||
        paymentIntent.metadata.userId !== req.userId
      ) {
        return res.status(400).json({ message: "payment intent mismatch" });
      }

      // we will check if the payment intent was successful
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          message: `payment intent not succeeded. Status: ${paymentIntent.status}`
        });
      }

      // Here, we will save the booking of the hotel we made. we will take all the body of the request, that is all the data from the booking form after we had made payment
      const newBooking: BookingType = {
        ...req.body,
        userId: req.userId
      };

      // console.log("new booking ", newBooking);

      // we will find the hotel we booked and updated the booking field with the records of the booking we booked
      // the $push means update just the field "bookings"
      // we used { new: true } so that it will return the latest updated hotel record base on that id
      const hotel = await Hotel.findOneAndUpdate(
        { _id: req.params.hotelId },
        {
          $push: { bookings: newBooking }
        },
        { new: true }
      );

      // we will check if the hotel was found and updated
      if (!hotel) {
        return res.status(400).json({ message: "hotel not found" });
      }

      // console.log("hotel updated ", hotel);

      // we will save the booking record we updated in the Hotel table
      await hotel.save();

      // insert the booking too to the booking table
      const booking = new Booking(newBooking);

      // save the booking too to the booking table
      await booking.save();

      // we will not return anything to the frontend because it's not necessary
      res.status(200).send();
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

export default router;

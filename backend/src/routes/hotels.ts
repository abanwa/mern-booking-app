import express, { Request, Response } from "express";
import Hotel from "../models/hotel";
import { HotelSearchResponse } from "../shared/types";
import { param, validationResult } from "express-validator";

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

export default router;

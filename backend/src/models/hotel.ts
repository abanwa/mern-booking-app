import mongoose from "mongoose";
import { BookingType, HotelType } from "../shared/types";

// this is our booking table after we have paid for the hotel booking
const bookingSchema = new mongoose.Schema<BookingType>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  adultCount: { type: Number, required: true },
  childCount: { type: Number, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  userId: { type: String, required: true },
  totalCost: { type: Number, required: true }
});

export const Booking = mongoose.model<BookingType>("Booking", bookingSchema);

// WE WILL LINK OUR BOOKING TABLE TO THE HOTEL TABLE

// HotelType is the hotel table columns/fields names and the types.
const hotelSchema = new mongoose.Schema<HotelType>({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  adultCount: { type: Number, required: true },
  childCount: { type: Number, required: true },
  facilities: [{ type: String, required: true }],
  pricePerNight: { type: Number, required: true },
  starRating: { type: Number, required: true, min: 1, max: 5 },
  imageUrls: [{ type: String, required: true }],
  lastUpdated: { type: Date, required: true },
  bookings: [bookingSchema]
});

const Hotel = mongoose.model<HotelType>("Hotel", hotelSchema);

export default Hotel;

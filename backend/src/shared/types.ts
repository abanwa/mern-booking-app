// this is the hotel table columns/fields names and the types.
export type HotelType = {
  _id: string;
  userId: string;
  name: string;
  city: string;
  country: string;
  description: string;
  type: string;
  adultCount: number;
  childCount: number;
  facilities: string[];
  pricePerNight: number;
  starRating: number;
  imageUrls: string[];
  lastUpdated: Date;
  bookings: BookingType[];
};

export type HotelSearchResponse = {
  data: HotelType[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
};

// THIS IS HOW OUR RESPONSE WILL BE LIKE WHEN WE CREATE A HOTEL BOOKING AND STORE IN OUR DATABASE AFTER PAYENT AND ALSO HOW OUR TABLE WILL LOOK LIKE . we link out booking table to our hotel table the booking .
export type BookingType = {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  adultCount: number;
  childCount: number;
  checkIn: Date;
  checkOut: Date;
  totalCost: number;
};

// FOR THE USER TYPE. HOW THE RESPONSE WILL BE LIKE AND HOW THE TABLE WILL BE LIKE
export type UserType = {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

// THIS IS HOW OUR RESPONSE WILL LOOK LIKE  WHEN WE INITIALISE STRIPE PAYMENT IN OUR BACKEND
export type PaymentIntentResponse = {
  paymentIntentId: string;
  clientSecret: string;
  totalCost: number;
};

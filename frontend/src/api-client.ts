import { RegisterFormData } from "./pages/Register";
import { SignInFormData } from "./pages/SignIn";
import { HotelSearchResponse, HotelType } from "../../backend/src/shared/types";

// the API_BASE_URL will come from the environment variable. env file. the reason is dependong if we are developing from our own machine or if we deploy to render. the API_BASE_URL will be different

// because we are using VITE, that is how we import environment variables from .env file
// the reason we make it || "" is because if we  run "npm run build" and join our frontend to the backend using app.use(express.static(path.join(__dirname, "../../frontend/dist"))), there will be no nee d for the BASE_URL because we will use the same server for the request
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// THIS IS WHERE WE WILL PUT ALL OUR FETCH REQUEST
// we are going to use react-query to handle and making the actual request and storing the state and errors
// React-Query is an industrial package. we will install it using "npm i react-query"
export const register = async (formData: RegisterFormData) => {
  console.log("formData ", formData);
  console.log("api base url ", API_BASE_URL);
  // the credentials:"include" means anytime we make a hhtp request, we want to include any HHTP cookies along with the request and also set any cookies that we get back from the server on the browser. so this is telling the browser to set the cookies but we don't deal with the actual cookie ourselves in this code
  const response = await fetch(`${API_BASE_URL}/api/users/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  });

  const responseBody = await response.json();
  console.log("responseBody ", responseBody);

  // from the backend, it will return 200 status which is "ok"
  if (!responseBody.success) {
    throw new Error(responseBody.message);
  }
};

// FOR SIGN IN
// the credentials: include will tell the browser to send the HTTP cookie stored in the cookies
export const signIn = async (formData: SignInFormData) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.message);
  }

  return body;
};

// VALIDATE TOKEN . THIS HELPS TO KNOW WHETHER USER IS LOGGED IN OR NOT
export const validateToken = async () => {
  const response = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Token invalid");
  }

  return response.json();
};

// SIGN OUT
export const signOut = async () => {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    credentials: "include",
    method: "POST"
  });

  if (!response.ok) {
    throw new Error("Error during sign out");
  }
};

// TO ADD HOTEL TO OUR HOTEL TABLE IN OUR DATABASE
export const addMyHotel = async (hotelFormData: FormData) => {
  const response = await fetch(`${API_BASE_URL}/api/my-hotels`, {
    method: "POST",
    credentials: "include",
    body: hotelFormData
  });

  if (!response.ok) {
    throw new Error("Failed to add hotel");
  }

  return response.json();
};

// Promise<HotelType> is like telling the API how the response or what the response will be like. this is from the hotel table in model folder inn the backend. it is what the hotel table will be like. the reason is because it makes the frontend and backend of the same type mode
export const fetchMyHotels = async (): Promise<HotelType[]> => {
  const response = await fetch(`${API_BASE_URL}/api/my-hotels`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Error fetching hotels");
  }

  return response.json();
};

// API TO FETCH A SINGLE HOTEL UISNG THE HOTEL ID FROM DATABSE/BACKEND
// This Promise<HotelType> is telling our component that the response will be in the form of the HotelType we specified in our backend/src/shared/types.ts . In this case, since it is a single hotel, we will not add array [] to the HotelType
export const fetchMyHotelById = async (hotelId: string): Promise<HotelType> => {
  const response = await fetch(`${API_BASE_URL}/api/my-hotels/${hotelId}`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Error fetching Hotels");
  }

  return response.json();
};

// THIS IS THE API TO UPADTE OUR HOTEL IN OUR SERVER / DATABASE
export const updateMyHotelById = async (hotelFormData: FormData) => {
  const response = await fetch(
    `${API_BASE_URL}/api/my-hotels/${hotelFormData.get("hotelId")}`,
    {
      method: "PUT",
      body: hotelFormData,
      credentials: "include"
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update Hotel");
  }

  // this will return the updated hotel data
  return response.json();
};

// TO MAKE SEARCH WHEN WE CLICK THE SEARCH BUTTON
export type SearchParams = {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  adultCount?: string;
  childCount?: string;
  page?: string;
  facilites?: string[];
  types?: string[];
  stars?: string[];
  maxPrice?: string;
  sortOption?: string;
};

// HotelSearchResponse is from backend. it specifies how our response that we will get from the backend will be like. it helps to make sure that the backend and frontend response are in sync when it comes to the shape of the response
export const searchHotels = async (
  searchParams: SearchParams
): Promise<HotelSearchResponse> => {
  // Here, we will build up the url using the url build up object
  const queryParams = new URLSearchParams();
  queryParams.append("destination", searchParams.destination || "");
  queryParams.append("checkIn", searchParams.checkIn || "");
  queryParams.append("checkOut", searchParams.checkOut || "");
  queryParams.append("adultCount", searchParams.adultCount || "");
  queryParams.append("childCount", searchParams.childCount || "");
  queryParams.append("page", searchParams.page || "");

  // this is part of the filter search
  queryParams.append("maxPrice", searchParams.maxPrice || "");
  queryParams.append("sortOption", searchParams.sortOption || "");

  // if facilities are selected/checked to help sort search, we will append each of those facilitiues selected to the queryParams
  searchParams.facilites?.forEach((facility) =>
    queryParams.append("facilities", facility)
  );

  // if types are selected/checked to help sort search, we will append each of those types selected to the queryParams
  searchParams.types?.forEach((type) => queryParams.append("types", type));

  // if stars are selected/checked to help sort search, we will append each of those stars selected to the queryParams
  searchParams.stars?.forEach((star) => queryParams.append("stars", star));

  const response = await fetch(
    `${API_BASE_URL}/api/hotels/search?${queryParams}`
  );

  if (!response.ok) {
    throw new Error("Error fetching hotels");
  }

  return response.json();
};

// API TO FETCH THE HOTEL BY THE ID
export const fetchHotelById = async (hotelId: string): Promise<HotelType> => {
  const response = await fetch(`${API_BASE_URL}/api/hotels/${hotelId}`);
  if (!response.ok) {
    throw new Error("Error fetching hotels");
  }

  return response.json();
};

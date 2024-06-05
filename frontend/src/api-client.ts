import { RegisterFormData } from "./pages/Register";
import { SignInFormData } from "./pages/SignIn";
import { HotelType } from "../../backend/src/shared/types";

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

import express, { Request, Response } from "express";
import cors from "cors";
// to create the tsconfig.json file, we ran "npx tsc --init" in our backend folder/directory. then we add "outDir": "./dist", then in our package.json file, we will add "build": "npm install && npx tsc" and "start": "node ./dist/index.js" then in the backend in our command terminal, we will run "npm run"
// this will load our environment variables (.env files variables)
import "dotenv/config";
//this helps us connect to the mongoDB database  and interact with our database using code just like php mysql helps us connect and intereact with our sql database
import mongoose from "mongoose";

import cookieParser from "cookie-parser";
import path from "path";

// we are importing the /register endpoint we created into index.ts
import userRoutes from "./routes/users";
import authRoutes from "./routes/auth";
import myHotelRoutes from "./routes/my-hotels";
import hotelRoutes from "./routes/hotels";

// we use "npm i stripe" to install stripe SDK

// after we run "npm i cloudinary" to save our image uploads, we will import it
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// the mongoose will connect to our mongoDB databse using our credentials in our environment file (.env file)
// mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string).then(() => {
//   console.log(
//     "Connection to database: ",
//     process.env.MONGODB_CONNECTION_STRING
//   );
// });
mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string);

// my database name is mern-booking-app-db and my database password is Q3pYKn91vT7NClIt and mt database username is admin
const app = express();
// this will help us to access the token stored on the browser cookie through the cookie property
app.use(cookieParser());
// this helps to convert the body of API resquest to json automatically so that we can handle it
app.use(express.json());
// this helps to us to parse the url to get the parameters
app.use(express.urlencoded({ extended: true }));
// this is a security thing that will prevent certain request from certain urls if it does not agree with them
// this means that our server is only going to accept request from this URL which will be defined in our environment file and the URL must include credentials
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  })
);

// This is after we have run our "npm rub build" command in our terminal for both the backend and frontend to compress the file beofre we can write this line of code below . This is to join the backend to the frontend dist folder after we have run our "npm run build" command in our terminal . this will serve the compressed forntend dist files to the backend . we will run "npm run build" again in our backend. this will bundle the front end code to the backend code so that everything will serve from the same server
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// TO LOGIN USERS
app.use("/api/auth", authRoutes);
// any request that comes into our api that is prefix with /api/users/ will go to our userRoutes TO REGISTER USER
app.use("/api/users", userRoutes);
// TO INSERT A HOTEL RECORD/ BOOK A HOTEL
app.use("/api/my-hotels", myHotelRoutes);

// THIS IS TO SEARCH HOTEL RECORDS/DATA
app.use("/api/hotels", hotelRoutes);

// this means that any request that are not API endpoint, let the react-router-dom package handle the redirecting of the request first. The reason we have to do this is because some of our routes are behind conditional logic and won't be part of the static file that we are pointing to be up here because they are generated at request time. Our hotel route is behind a conditional logic and is a protected route, it doesn't exist in the static files that we deploy at deploy time so the code gets a bit confused and thinks it's an API route, so we have to specify explicitly for all requests that are not API routes to go to the index.html of the frontend. This is a pretty standard setup
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

// we will start the server and we will parse the port number to listen to
app.listen(7000, () => {
  console.log("Server is running on localhost:7000");
});

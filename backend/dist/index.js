"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// to create the tsconfig.json file, we ran "npx tsc --init" in our backend folder/directory. then we add "outDir": "./dist", then in our package.json file, we will add "build": "npm install && npx tsc" and "start": "node ./dist/index.js" then in the backend in our command terminal, we will run "npm run"
// this will load our environment variables (.env files variables)
require("dotenv/config");
//this helps us connect to the mongoDB database  and interact with our database using code just like php mysql helps us connect and intereact with our sql database
const mongoose_1 = __importDefault(require("mongoose"));
// we are importing the /register endpoint we created into index.ts
const users_1 = __importDefault(require("./routes/users"));
const auth_1 = __importDefault(require("./routes/auth"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
// the mongoose will connect to our mongoDB databse using our credentials in our environment file (.env file)
// mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string).then(() => {
//   console.log(
//     "Connection to database: ",
//     process.env.MONGODB_CONNECTION_STRING
//   );
// });
mongoose_1.default.connect(process.env.MONGODB_CONNECTION_STRING);
// my database name is mern-booking-app-db and my database password is Q3pYKn91vT7NClIt and mt database username is admin
const app = (0, express_1.default)();
// this will help us to access the token stored on the browser cookie through the cookie property
app.use((0, cookie_parser_1.default)());
// this helps to convert the body of API resquest to json automatically so that we can handle it
app.use(express_1.default.json());
// this helps to us to parse the url to get the parameters
app.use(express_1.default.urlencoded({ extended: true }));
// this is a security thing that will prevent certain request from certain urls if it does not agree with them
// this means that our server is only going to accept request from this URL which will be defined in our environment file and the URL must include credentials
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
// This is after we have run our "npm rub build" command in our terminal for both the backend and frontend to compress the file beofre we can write this line of code below . This is to join the backend to the frontend dist folder after we have run our "npm run build" command in our terminal . this will serve the compressed forntend dist files to the backend . we will run "npm run build" again in our backend
app.use(express_1.default.static(path_1.default.join(__dirname, "../../frontend/dist")));
// TO LOGIN USERS
app.use("/api/auth", auth_1.default);
// any request that comes into our api that is prefix with /api/users/ will go to our userRoutes TO REGISTER USER
app.use("/api/users", users_1.default);
// we will start the server and we will parse the port number to listen to
app.listen(7000, () => {
    console.log("Server is running on localhost:7000");
});

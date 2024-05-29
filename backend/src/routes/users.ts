import express, { Request, Response } from "express";
import User from "../models/user";
import jwt from "jsonwebtoken";
import { check, validationResult } from "express-validator";

// "npm i bcryptjs"  is used to install the package we will used to encrypt the password
// "npm i @types/bcryptjs --save-dev"
// "npm i jsonwebtoken" is used to install the package to generate the token user will use to authenticate when they login
// "npm i @types/jsonwebtoken --save-dev" we do --save-dev as we only need the type for development

const router = express.Router();

// "npm i express-validator"
// the check() is used to validate the the body or form data we submitted to register user and it's gotten from "npm i express-validator"
// /api/users/register
router.post(
  "/register",
  [
    check("firstName", "First Name is required").isString(),
    check("lastName", "Last Name is required").isString(),
    check("email", "Email is required").isEmail(),
    check("password", "Password with 6 or more character required").isLength({
      min: 6
    })
  ],
  async (req: Request, res: Response) => {
    // we will get the errors if there is an error from our validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()
      });
    }

    try {
      // first check if this user exist!
      let user = await User.findOne({
        email: req.body.email
      });

      // if the user exist, we should return this error message saying that user already exists
      if (user) {
        return res.status(400).json({
          message: "User already exists"
        });
      }

      // req.body is the body of the user payload or form data the user submit when registering
      user = new User(req.body);
      // we will save the user
      await user.save();

      const tokenData = { userId: user.id };

      // the first argument will be additional information we want to specify in the token in form of object. we will store the user_id in the token. it will help to identify who the user is that is trying to make a given request
      // the second argument is the JWT secret key that we used to encrypt the token so that it can only be access by using the secret key. we will store the secret key as environment variable in in our environment file (.env file). we want it to be a string. the last argument is any additional option. maybe when it will expire . the JWT_SECRET_KEY is just a random alphanumeric and special characters https://randomkeygen.com/
      const token = jwt.sign(tokenData, process.env.JWT_SECRET_KEY as string, {
        expiresIn: "1d"
      });

      // the httpOnly means it is a http only token and it can only be access on the server and secure means it only accept cookies over https
      const tokenOption = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // this will be false for development and true for production
        maxAge: 86400000 // the maxAge should be the same as when the token will expire. 86400000 means 1 day in milliseconds
      };

      // the first argument is the name of our cookie, the second argument is our token and the third argument is cookie token option
      res.cookie("auth_token", token, tokenOption);

      // we will not send anything in the body of the response because we are sending we are sending a http cookie and the cookie  set automatically in the browser for us. It means we don't have to write any code on the frontend to handle it
      return res.status(200).send({
        message: "User registered OK",
        success: true
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Something went wrong"
      });
    }
  }
);

export default router;

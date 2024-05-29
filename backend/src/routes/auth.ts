import express, { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import User from "../models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import verifyToken from "../middleware/auth";

const router = express.Router();

// we will validate the login email and password
// /api/auth/login
router.post(
  "/login",
  [
    check("email", "Email is required").isEmail(),
    check("password", "Password with 6 or more characters required").isLength({
      min: 6
    })
  ],
  async (req: Request, res: Response) => {
    // check if there is any error in our check() validation
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()
      });
    }

    // we will destructure our request body
    const { email, password } = req.body;

    try {
      // we will find the user with email addess we parse in, in our User table
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          message: "Invalid Credentials"
        });
      }

      // we will check if the user login password and the user password in our database match
      const isMatch = await bcrypt.compare(password, user.password);

      // if the encryped passwod does not match, the do this
      if (!isMatch) {
        return res.status(400).json({
          message: "Invalid Credentialsss"
        });
      }

      const tokenData = {
        userId: user.id
      };

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

      res.status(200).json({
        userId: user._id
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Something went wrong"
      });
    }
  }
);

// what this endpoint will do is whenever we make a request to a token endpoint, it will run a middleware which will check the http cookie which was sent from the frontend request. if it passes, it will forward the request to the third argument (function) which will send back a 200 status  and also the user id which we will get from the token
router.get("/validate-token", verifyToken, (req: Request, res: Response) => {
  res.status(200).send({
    userId: req.userId
  });
});

router.post("/logout", (req: Request, res: Response) => {
  // Here, we will make the token in the browser cookie to be empty and make the expires date to be zero second
  // and it will return the empty token
  res.cookie("auth_token", "", {
    expires: new Date(0)
  });
  res.send();
});

export default router;

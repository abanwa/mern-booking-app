import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// this means add userId to the Request type in the Express namespace
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  // the first thing is to get the auth token from the cookie
  // we will use the key we used to set the token to access/get it
  //  cookie property does not exist on request, so we will install cookie  parser package
  // "npm i cookie-parser"
  // "npm i --save-dev @types/cookie-parser"
  const token = req.cookies["auth_token"];

  if (!token) {
    return res.status(401).json({
      message: "unauthorized"
    });
  }

  try {
    // we will use the secret key we use to create the token to verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    // userId does not exist on type request/req. so we will extend the express request type above and make it global
    req.userId = (decoded as JwtPayload).userId;
    // this will call the next function available after  verifying the user auth
    next();
  } catch (error) {
    return res.status(401).json({
      message: "unauthorized"
    });
  }
};

export default verifyToken;

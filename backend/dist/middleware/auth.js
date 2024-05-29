"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyToken = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        // userId does not exist on type request. so we will extend the express request type above and make it global
        req.userId = decoded.userId;
        // this will call the next function available after  verifying the user auth
        next();
    }
    catch (error) {
        return res.status(401).json({
            message: "unauthorized"
        });
    }
};
exports.default = verifyToken;

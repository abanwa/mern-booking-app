"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const user_1 = __importDefault(require("../models/user"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
// we will validate the login email and password
// /api/auth/login
router.post("/login", [
    (0, express_validator_1.check)("email", "Email is required").isEmail(),
    (0, express_validator_1.check)("password", "Password with 6 or more characters required").isLength({
        min: 6
    })
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // check if there is any error in our check() validation
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()
        });
    }
    // we will destructure our request body
    const { email, password } = req.body;
    try {
        // we will find the user with email addess we parse in, in our User table
        const user = yield user_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Invalid Credentials"
            });
        }
        // we will check if the user login password and the user password in our database match
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        // if the encryped passwod does not match, the do this
        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid Credentialsss"
            });
        }
        const tokenData = {
            userId: user.id
        };
        const token = jsonwebtoken_1.default.sign(tokenData, process.env.JWT_SECRET_KEY, {
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
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Something went wrong"
        });
    }
}));
// what this endpoint will do is whenever we make a request to a token endpoint, it will run a middleware which will check the http cookie which was sent from the frontend request. if it passes, it will forward the request to the third argument (function) which will send back a 200 status  and also the user id which we will get from the token
router.get("/validate-token", auth_1.default, (req, res) => {
    res.status(200).send({
        userId: req.userId
    });
});
router.post("/logout", (req, res) => {
    // Here, we will make the token in the browser cookie to be empty and make the expires date to be zero second
    // and it will return the empty token
    res.cookie("auth_token", "", {
        expires: new Date(0)
    });
    res.send();
});
exports.default = router;

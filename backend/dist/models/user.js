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
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.default.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true }
});
// here, we will add a function that process our saving to the document
// the string we parse in pre() indicates the action that we want
// before we save to database, we will check if we have the password, then we will bcrypt it
// This is just a middleware for mongoDB. we tell the mongoDB database that before any update to the document is saved, we should check if the password has changed, if the password has changed, we will bcrypt and hash it. Then we will call the next function. The next() function is handled by mongoDB database
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified("password")) {
            this.password = yield bcryptjs_1.default.hash(this.password, 8);
        }
        // this means we will ren the next function
        next();
    });
});
// User will be the table name in our database and userSchema will be the permission/rules
// the UserType defines the variable type or input type that we ill entered into the database
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;

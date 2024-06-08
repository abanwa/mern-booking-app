import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UserType } from "../shared/types";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true }
});

// here, we will add a function that process our saving to the document
// the string we parse in pre() indicates the action that we want
// before we save to database, we will check if we have the password, then we will bcrypt it
// This is just a middleware for mongoDB. we tell the mongoDB database that before any update to the document is saved, we should check if the password has changed, if the password has changed, we will bcrypt and hash it. Then we will call the next function. The next() function is handled by mongoDB database
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }

  // this means we will ren the next function
  next();
});

// User will be the table name in our database and userSchema will be the permission/rules
// the UserType defines the variable type or input type that we ill entered into the database
const User = mongoose.model<UserType>("User", userSchema);

export default User;

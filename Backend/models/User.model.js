import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username:{
    type: String,
    required: true,
    trim: true
  },
  password:{
    type: String,
    required: true
  },
  confirm_password:{
    type: String,
  },
  company:{
    type: String
  },
  email:{
    type: String,
    required: true
  },
  phone:{
    type: Number
  }
},{timestamp: true});

const User = mongoose.module('userSchema', User)

export default User;
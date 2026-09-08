// Backend/models/User.model.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default
    },
    company: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
      match: [/^\d{10,}$/, "Please provide a valid phone number"],
    },
    role: {
      type: String,
      enum: ["user", "admin", "agent"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    teamMembers: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          email: { type: String, required: true, lowercase: true, trim: true },
          role: {
            type: String,
            enum: ["admin", "agent", "viewer"],
            default: "viewer",
          },
          status: { type: String, enum: ["pending", "active"], default: "pending" },
          invitedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password before saving
// Use async middleware without the callback `next` to avoid "next is not a function" errors
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to remove sensitive data
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model("User", userSchema);

export default User;

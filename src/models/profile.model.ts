import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: String,
    gender: String,
    gender_probability: Number,
    age: Number,
    age_group: String,
    country_id: String,
    country_name: String,
    country_probability: Number,
  },
  { timestamps: { createdAt: "created_at" } }
);

export default mongoose.model("Profile", schema);
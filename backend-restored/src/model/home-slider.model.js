import mongoose from "mongoose";

const homeSliderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: 220,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    image: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.every((item) => typeof item === "string"),
        message: "Poster images must be an array of URLs.",
      },
    },
    link: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

homeSliderSchema.index({ isActive: 1, order: 1, createdAt: -1 });

const HomeSliderModel = mongoose.models.homeSliders || mongoose.model("homeSliders", homeSliderSchema);

export default HomeSliderModel;

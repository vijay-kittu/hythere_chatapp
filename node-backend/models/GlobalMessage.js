import mongoose from "mongoose";

const globalMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      text: {
        type: String,
        default: "",
      },
      image: {
        type: String,
        default: "",
      },
    },
  },
  { timestamps: true }
);

const GlobalMessage = mongoose.model("GlobalMessage", globalMessageSchema);

export default GlobalMessage;

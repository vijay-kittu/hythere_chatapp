import mongoose from "mongoose";

const privateMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
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
        type: String, // This will store the image URL
        default: "",
      },
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create an index for efficient querying of chat history
privateMessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

const PrivateMessage = mongoose.model("PrivateMessage", privateMessageSchema);
export default PrivateMessage;

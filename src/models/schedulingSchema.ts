import mongoose from "mongoose";

const Schema = mongoose.Schema;

mongoose
  .connect("mongodb://localhost:27017/AmUp")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

const schedulingSchema = new Schema({
  chatID: {
    type: Number,
    required: true,
  },
  interval: {
    type: Number,
    required: true,
  },
  domain: {
    type: String,
    required: true,
  },
  typeNotification: {
    type: String,
    default: "telegram",
  },
  email: {
    type: String,
    default: null,
  },
});

schedulingSchema.index({ interval: 1 });

const Scheduling = mongoose.model("Scheduling", schedulingSchema);

export default Scheduling;

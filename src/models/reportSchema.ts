import { Schema, model } from "mongoose";
import moment from "moment";

const reportSchema = new Schema({
  chatID: {
    type: Number,
    required: true,
  },
  scheduleId: {
    type: Schema.Types.ObjectId,
    ref: "Scheduling",
    required: true,
  },
  statusCode: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: String,
    default: () => moment().format("HH:mm"),
  },
});

const Report = model("Report", reportSchema);

export default Report;

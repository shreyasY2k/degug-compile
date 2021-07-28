const mongoose = require("mongoose");

const CodeSchema = mongoose.Schema(
  {
    question: {
      type: String
    },
    solution: {
      type: String
    },
    level: {
      type: Number,
      default: 1
    },
    time: {
      type: Number
    }
  },
  { collection: "code" }
);
module.exports = mongoose.model("code", CodeSchema);

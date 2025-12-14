

const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    unique: true
  },
  tier1Count: {
    type: Number,
    default: 0
  },
  tier2Count: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("Ticket", ticketSchema);

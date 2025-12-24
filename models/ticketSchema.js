// const mongoose = require("mongoose");

// const ticketSchema = new mongoose.Schema({
//   ticketNo: String,
//   tier: Number,           // store as number
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model("Ticket", ticketSchema);

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

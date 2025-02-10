// models/Holiday.js
const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  holidayName: {
    type: String,
    required: true
  },
  holidayDate: {
    type: Date,
    required: true
  },
  holidayDay: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Holiday = mongoose.model('Holiday', holidaySchema);
module.exports = Holiday;
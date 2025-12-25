
const mongoose = require("mongoose");

const { Schema } = mongoose;

const xumoChatSchema = new Schema({
 
chatId:{
    type:Number,
    required:true
},
device:{
    type:String,
    required:true
},
brand:{
    type:String,
    required:true
},
type:{
    type:String,
     required:true
},
subtype:{
  type:String,
   required:true  
},
ticketNo:{
    type:Number,
     required:true
},
tier:{
    type:Number,
     required:true
},
  nameCheck: {
    type: Boolean,
    default: false
  },

  emailCheck: {
    type: Boolean,
    default: false
  },

  contactCheck: {
    type: Boolean,
    default: false
  },

  prefTime: {
    type: String,
    default: Date.now
  },
  prefDate: {
    type: Date,
    default: Date.now
  },

  timeZone: {
    type: String,
    default: ""
  },

  MAC_Check: {
    type: Boolean,
    default: false
  },

  serialNo_Check: {
    type: Boolean,
    default: false
  },
redirectToProd:{
    type:String,
    required:true
},
comment:{
    type:String,
    required:true
},

  
},
{
  timestamps: true   // ✅ THIS LINE IS REQUIRED
});

module.exports = mongoose.model("XumoChat", xumoChatSchema);

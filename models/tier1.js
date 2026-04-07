
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
    type:String,
     required:true
},

redirectToProd:{
    type:String,
    required:true
},
comment:{
    type:String,
    required:true
}
  
});

module.exports = mongoose.model("XumoChat", xumoChatSchema);


const mongoose = require("mongoose");

const { Schema } = mongoose;

const employeeSchema = new Schema({
 
  id:{ type:Number,required:true},
  password:{type:String,required:true}
  
});

module.exports = mongoose.model("Employee", employeeSchema);

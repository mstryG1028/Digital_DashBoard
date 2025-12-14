
const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/Project");
const { Schema } = mongoose;

const employeeSchema = new Schema({
 
  id:{ type:Number,required:true},
  password:{type:password,required:true}
  
});

module.exports = mongoose.model("Employee", employeeSchema);

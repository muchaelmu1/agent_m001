import mongoose from "mongoose";

const AgentSchema = new mongoose.Schema({
  AgentId:{
    type: String,
    required: true
  },
  status:{
    type: String,
    enum: [
      "active",
      "inacive"
    ],
    default: "active"
  }
});

const Agent = mongoose.model('AgentSchema', Agent);

export default Agent;



import mongoose from "mongoose";
import Task from './Task.js'

const ActivityShema = new mongoose.Schema({
  task_id:{
    type: mongoose.Type.ObjectId,
    ref: 'Task'
  }
});

const Activity = mongoose.model('ActivityShema', Activity);

export default Activity;

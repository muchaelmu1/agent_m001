// Backend/models/Task.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const TaskSchema = new Schema(
  {
    agentId: { type: String, required: true },
    type: { type: String, required: true },
    input: { type: Schema.Types.Mixed },
    status: { type: String, default: 'queued' }, // queued, running, done, failed
    result: { type: Schema.Types.Mixed },
    error: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
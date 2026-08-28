import mongoose, { type Document, Schema } from 'mongoose';

export interface IReminder extends Document {
  season: number;
  matchday: number;
  sentAt: Date;
}

const reminderSchema = new Schema<IReminder>({
  season: { type: Number, required: true },
  matchday: { type: Number, required: true },
  sentAt: { type: Date, default: Date.now },
});

// guarantees at most one reminder per matchday, even if the cron fires
// concurrently or the process restarts between checks
reminderSchema.index({ season: 1, matchday: 1 }, { unique: true });

const Reminder =
  (mongoose.models.Reminder as mongoose.Model<IReminder>) ||
  mongoose.model<IReminder>('Reminder', reminderSchema);

export default Reminder;

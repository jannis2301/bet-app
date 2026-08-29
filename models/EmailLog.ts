import mongoose, { type Document, Schema } from 'mongoose';

export interface IEmailLog extends Document {
  sentAt: Date;
}

const emailLogSchema = new Schema<IEmailLog>({
  sentAt: { type: Date, default: Date.now },
});

// lets Mongo expire old rows on its own so the collection doesn't grow
// forever — well past any window sendEmail.ts ever queries (see DAY_MS there)
emailLogSchema.index({ sentAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 2 });

const EmailLog =
  (mongoose.models.EmailLog as mongoose.Model<IEmailLog>) ||
  mongoose.model<IEmailLog>('EmailLog', emailLogSchema);

export default EmailLog;

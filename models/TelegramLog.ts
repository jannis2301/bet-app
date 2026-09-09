import mongoose, { type Document, Schema } from 'mongoose';

export interface ITelegramLog extends Document {
  sentAt: Date;
}

const telegramLogSchema = new Schema<ITelegramLog>({
  sentAt: { type: Date, default: Date.now },
});

// lets Mongo expire old rows on its own so the collection doesn't grow
// forever — well past any window sendTelegramMessage.ts ever queries (see
// DAY_MS there)
telegramLogSchema.index(
  { sentAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 2 }
);

const TelegramLog =
  (mongoose.models.TelegramLog as mongoose.Model<ITelegramLog>) ||
  mongoose.model<ITelegramLog>('TelegramLog', telegramLogSchema);

export default TelegramLog;

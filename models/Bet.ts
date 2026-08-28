import mongoose, { type Document, Schema, type Types } from 'mongoose';

export interface IBet extends Document {
  matchDay: number;
  matchID: number;
  season: number;
  homeScore: number;
  awayScore: number;
  actualHomeScore?: number;
  actualAwayScore?: number;
  pointsEarned: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const betSchema = new Schema<IBet>(
  {
    matchDay: { type: Number, required: [true, 'Please provide matchday'] },
    matchID: { type: Number, required: [true, 'Please provide matchID'] },
    season: { type: Number, required: [true, 'Please provide season'] },
    homeScore: {
      type: Number,
      required: [true, 'Please provide a score'],
      min: 0,
    },
    awayScore: {
      type: Number,
      required: [true, 'Please provide a score'],
      min: 0,
    },
    actualHomeScore: { type: Number },
    actualAwayScore: { type: Number },
    pointsEarned: { type: Number, default: 0 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user'],
    },
  },
  { timestamps: true }
);

betSchema.index({ createdBy: 1, matchID: 1 }, { unique: true });

const Bet =
  (mongoose.models.Bet as mongoose.Model<IBet>) ||
  mongoose.model<IBet>('Bet', betSchema);

export default Bet;

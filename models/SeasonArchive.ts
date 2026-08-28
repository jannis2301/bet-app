import mongoose, { type Document, Schema } from 'mongoose';

interface IArchivedLeaderboardEntry {
  name: string;
  totalPoints: number;
  exactHits: number;
}

export interface ISeasonArchive extends Document {
  season: number;
  archivedAt: Date;
  // snapshotted at archive time (name included) rather than referencing
  // User documents — the whole point of archiving is that the season's bets
  // (and eventually the users who placed them) can be cleaned up afterwards
  // without losing the historical standings
  leaderboard: IArchivedLeaderboardEntry[];
}

const archivedLeaderboardEntrySchema = new Schema<IArchivedLeaderboardEntry>(
  {
    name: { type: String, required: true },
    totalPoints: { type: Number, required: true },
    exactHits: { type: Number, required: true },
  },
  { _id: false }
);

const seasonArchiveSchema = new Schema<ISeasonArchive>({
  season: { type: Number, required: true, unique: true },
  archivedAt: { type: Date, default: Date.now },
  leaderboard: { type: [archivedLeaderboardEntrySchema], default: [] },
});

const SeasonArchive =
  (mongoose.models.SeasonArchive as mongoose.Model<ISeasonArchive>) ||
  mongoose.model<ISeasonArchive>('SeasonArchive', seasonArchiveSchema);

export default SeasonArchive;

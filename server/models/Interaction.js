import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema(
  {
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['LIKE', 'BOOKMARK', 'REPOST'],
      required: true,
    },
    quote: {
      type: String,
      trim: true,
    },
    folder: {
      type: String,
      trim: true,
      default: 'General',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only have one interaction of a specific type per submission (zero duplication)
interactionSchema.index({ submission: 1, user: 1, type: 1 }, { unique: true });
interactionSchema.index({ user: 1, type: 1, folder: 1 });
interactionSchema.index({ user: 1, type: 1 });

const Interaction = mongoose.model('Interaction', interactionSchema);

export default Interaction;

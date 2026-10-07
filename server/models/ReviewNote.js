import mongoose from 'mongoose';

const reviewNoteSchema = new mongoose.Schema(
  {
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comments: {
      type: String,
      required: [true, 'Review comments are required'],
      trim: true,
    },
    decision: {
      type: String,
      enum: ['APPROVED', 'REVISIONS_REQUESTED', 'REJECTED'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ReviewNote = mongoose.model('ReviewNote', reviewNoteSchema);

export default ReviewNote;

import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot be more than 150 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    abstract: {
      type: String,
      required: [true, 'Abstract is required'],
      maxlength: [500, 'Abstract cannot be more than 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_REVIEW', 'REVISIONS_REQUESTED', 'APPROVED', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    // If this is a draft revision of an existing published post
    draftOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      default: null,
    },
    // If this published post has an active working draft
    draftRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      default: null,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      // required: true, // Will be required once Category model is fully populated
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    image: {
      type: String,
      default: '',
    },
    readTime: {
      type: String,
      default: '',
    },
    moderation: {
      overallScore: { type: Number, default: 0 },
      grade: { type: String, default: 'CLEAN' },
      flagged: { type: Boolean, default: false },
      labels: [{ type: String }],
      summary: { type: String, default: 'Clean story' },
      categories: {
        sexist: {
          score: { type: Number, default: 0 },
          flagged: { type: Boolean, default: false },
          matches: [{ type: String }],
        },
        sexual: {
          score: { type: Number, default: 0 },
          flagged: { type: Boolean, default: false },
          matches: [{ type: String }],
        },
        explicit: {
          score: { type: Number, default: 0 },
          flagged: { type: Boolean, default: false },
          matches: [{ type: String }],
        },
        eighteenPlus: {
          score: { type: Number, default: 0 },
          flagged: { type: Boolean, default: false },
          matches: [{ type: String }],
        },
        racist: {
          score: { type: Number, default: 0 },
          flagged: { type: Boolean, default: false },
          matches: [{ type: String }],
        },
      },
      callbackTriggeredAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Create a text index for search functionality
submissionSchema.index({ title: 'text', abstract: 'text', content: 'text', tags: 'text' });
// Add compound indexes for faster dashboard querying
submissionSchema.index({ status: 1, author: 1 });

// Calculate read time before saving
submissionSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    this.readTime = `${readTime} min read`;
  }
  next();
});

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;

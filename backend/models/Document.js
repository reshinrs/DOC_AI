const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DocumentSchema = new Schema({
  originalName: { type: String, required: true },
  uploadedName: { type: String, required: true }, // Custom name by user
  storageName: { type: String, required: true }, // Actual stored filename
  filePath: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: [
      'Ingested',
      'Extraction_Pending',
      'Extracted',
      'Classification_Pending',
      'Classified',
      'Data_Extraction_Pending',
      'Data_Extracted',
      'Sentiment_Pending',
      'Analyzed',
      'Renaming_Pending',
      'Renamed',
      'Routing_Pending',
      'Routed',
      'Failed'
    ],
    default: 'Ingested',
  },
  extractedText: {
    type: String,
    default: '',
  },
  structuredData: {
    type: Schema.Types.Mixed,
    default: {},
  },
  sentiment: {
    type: String,
    enum: ['Positive', 'Negative', 'Neutral', 'N/A'],
    default: 'N/A',
  },
  classification: {
    type: String,
    default: 'Unclassified',
  },
  confidenceScore: {
    type: Number,
    default: 0,
  },
  routeDestination: {
    type: String,
    default: 'None',
  },
  logs: [
    {
      timestamp: { type: Date, default: Date.now },
      message: String,
    },
  ],
  similarityResults: [
    {
      comparedDocId: { type: Schema.Types.ObjectId, ref: 'Document' },
      comparedDocName: String,
      similarityScore: Number,
    },
  ],
}, { timestamps: true });

// Auto-update lastUpdatedAt before saving
DocumentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Document', DocumentSchema);

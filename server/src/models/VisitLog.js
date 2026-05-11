import mongoose from 'mongoose'

const visitLogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['page_visit', 'resume_download', 'project_click'],
  },
  ip: { type: String, default: 'unknown' },
  userAgent: { type: String, default: '' },
  referrer: { type: String, default: 'Direct' },
  meta: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now },
})

// Index so you can query logs quickly by type or date
visitLogSchema.index({ timestamp: -1 })
visitLogSchema.index({ type: 1, timestamp: -1 })

export const VisitLog = mongoose.model('VisitLog', visitLogSchema)

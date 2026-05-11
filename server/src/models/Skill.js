import mongoose from 'mongoose'

const SkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const Skill = mongoose.model('Skill', SkillSchema)

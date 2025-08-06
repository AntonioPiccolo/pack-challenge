const { z } = require('zod')

const validCategories = ['tutorial', 'documentation', 'template', 'example', 'guide']
const validLanguages = ['english', 'italian', 'spanish', 'french', 'german', 'portuguese', 'dutch', 'chinese', 'japanese', 'korean']
const validProviders = ['pack', 'google', 'aws', 'amazon']
const validRoles = ['Mentor / Coach', 'Mentee / Coachee']

const uploadResourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must not exceed 200 characters').trim(),
  description: z.string().min(1, 'Description is required').max(1000, 'Description must not exceed 1000 characters').trim(),
  category: z.enum(validCategories, { required_error: 'Category is required' }),
  language: z.enum(validLanguages, { required_error: 'Language is required' }),
  provider: z.enum(validProviders, { required_error: 'Provider is required' }),
  role: z.enum(validRoles, { required_error: 'Role is required' })
})

module.exports = {
  uploadResourceSchema,
  validCategories,
  validLanguages,
  validProviders,
  validRoles
}
// Job controllers - scaffold
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'

export const matchJobs = asyncHandler(async (req, res) => {
  sendSuccess(res, { message: 'Job matcher endpoint ready', data: null })
})

export const getMatchedJobs = asyncHandler(async (req, res) => {
  sendSuccess(res, { message: 'Get matched jobs endpoint ready', data: null })
})

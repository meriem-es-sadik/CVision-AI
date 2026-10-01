import api from '@/services/api'
import { getAnalysisHistoryRequest } from '@/services/analysisService'
import { getResumesRequest } from '@/services/resumeService'

/**
 * Job endpoints are still scaffolds on the server: they answer with `data: null`
 * until the matching pipeline lands. These helpers normalise both the null and
 * the array shape so the UI can render an honest empty state.
 */
function toList(payload) {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.items)) return payload.items
  return []
}

export { getResumesRequest, getAnalysisHistoryRequest }

export async function getMatchedJobsRequest() {
  const response = await api.get('/jobs/matched')
  return toList(response.data?.data)
}
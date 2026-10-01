import api from '@/services/api'

function unwrap(payload) {
  return payload?.data
}

function toList(payload) {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.items)) return payload.items
  return []
}

/**
 * Uploads a resume as multipart/form-data. Axios infers the multipart boundary
 * from the FormData payload, so no Content-Type is forced here.
 * Pass `onProgress` to receive the upload percentage (0-100).
 */
export async function uploadResumeRequest(file, { onProgress } = {}) {
  const formData = new FormData()
  formData.append('resume', file)

  const response = await api.post('/resumes/upload', formData, {
    timeout: 60_000,
    onUploadProgress: (event) => {
      if (typeof onProgress === 'function' && event?.total) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress(Math.min(100, Math.max(0, percent)))
      }
    },
  })

  return unwrap(response.data)?.resume ?? unwrap(response.data)
}

export async function getResumesRequest() {
  const response = await api.get('/resumes')
  return toList(response.data?.data)
}

export async function getResumeByIdRequest(id) {
  const response = await api.get(`/resumes/${id}`)
  const resume = unwrap(response.data)?.resume ?? unwrap(response.data)
  if (!resume) return null
  return resume
}

export async function deleteResumeRequest(id) {
  const response = await api.delete(`/resumes/${id}`)
  return unwrap(response.data)?.id ?? id
}
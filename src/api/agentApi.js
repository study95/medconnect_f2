import axiosInstance from './axiosInstance'

const generateIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'idemp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
}

export const agentApi = {
  // Storage & Uploads
  getPresignedUrl: async ({ file_name, file_type, category }) => {
    const response = await axiosInstance.post('/v1/agent/storage/presigned-url', {
      file_name,
      file_type,
      category,
    })
    return response.data
  },

  directUploadFile: async (formData) => {
    const response = await axiosInstance.post('/v1/agent/storage/direct-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  uploadToPresignedUrl: async (uploadUrl, file, contentType) => {
    // S3 PUT direct upload
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: file,
    })
    if (!response.ok) {
      throw new Error(`Cloud upload failed with status ${response.status}`)
    }
    return true
  },

  // Onboarding Submissions
  submitDoctorOnboarding: async (payload) => {
    const response = await axiosInstance.post('/v1/agent/onboarding/doctor', payload, {
      headers: {
        'X-Idempotency-Key': generateIdempotencyKey(),
      },
    })
    return response.data
  },

  submitHospitalOnboarding: async (payload) => {
    const response = await axiosInstance.post('/v1/agent/onboarding/hospital', payload, {
      headers: {
        'X-Idempotency-Key': generateIdempotencyKey(),
      },
    })
    return response.data
  },

  getOnboardingRequests: async (params = {}) => {
    const response = await axiosInstance.get('/v1/agent/onboarding/requests', { params })
    return response.data
  },

  getOnboardingRequestByCode: async (requestCode) => {
    const response = await axiosInstance.get(`/v1/agent/onboarding/requests/${requestCode}`)
    return response.data
  },

  resubmitOnboardingRequest: async (requestCode, payload) => {
    const response = await axiosInstance.post(`/v1/agent/onboarding/requests/${requestCode}/resubmit`, payload, {
      headers: {
        'X-Idempotency-Key': generateIdempotencyKey(),
      },
    })
    return response.data
  },

  // Wallet & Payout
  getWalletStatement: async (params = {}) => {
    const response = await axiosInstance.get('/v1/agent/wallet/statement', { params })
    return response.data
  },

  requestPayoutWithdrawal: async (payload) => {
    const response = await axiosInstance.post('/v1/agent/wallet/payout-request', payload, {
      headers: {
        'X-Idempotency-Key': generateIdempotencyKey(),
      },
    })
    return response.data
  },
}

export default agentApi

import axiosInstance from './axiosInstance'

const generateIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'idemp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
}

export const adminAgentApi = {
  // Agent Directory
  getAgents: async (params = {}) => {
    const response = await axiosInstance.get('/v1/admin/agents', { params })
    return response.data
  },

  createAgent: async (payload) => {
    const response = await axiosInstance.post('/v1/admin/agents', payload)
    return response.data
  },

  updateAgentStatus: async (id, status, reason = null) => {
    const response = await axiosInstance.patch(`/v1/admin/agents/${id}/status`, { status, reason })
    return response.data
  },

  // Onboarding Verification Queue
  getOnboardingQueue: async (params = {}) => {
    const response = await axiosInstance.get('/v1/admin/onboarding/queue', { params })
    return response.data
  },

  getOnboardingDetail: async (id) => {
    const response = await axiosInstance.get(`/v1/admin/onboarding/queue/${id}`)
    return response.data
  },

  processDecision: async (id, payload) => {
    const response = await axiosInstance.post(`/v1/admin/onboarding/queue/${id}/decision`, payload, {
      headers: {
        'X-Idempotency-Key': generateIdempotencyKey(),
      },
    })
    return response.data
  },

  revokeOnboarding: async (id, reason) => {
    const response = await axiosInstance.post(`/v1/admin/onboarding/queue/${id}/revoke-clawback`, { reason }, {
      headers: {
        'X-Idempotency-Key': generateIdempotencyKey(),
      },
    })
    return response.data
  },

  // Agent Payout Settlement Desk
  getPayoutsQueue: async (params = {}) => {
    const response = await axiosInstance.get('/v1/admin/agent-payouts', { params })
    return response.data
  },

  getPayoutDetail: async (id) => {
    const response = await axiosInstance.get(`/v1/admin/agent-payouts/${id}`)
    return response.data
  },

  settlePayout: async (id, payload) => {
    const response = await axiosInstance.post(`/v1/admin/agent-payouts/${id}/settle`, payload, {
      headers: {
        'X-Idempotency-Key': generateIdempotencyKey(),
      },
    })
    return response.data
  },

  rejectPayout: async (id, reason) => {
    const response = await axiosInstance.post(`/v1/admin/agent-payouts/${id}/reject`, { reason })
    return response.data
  },
}

export default adminAgentApi

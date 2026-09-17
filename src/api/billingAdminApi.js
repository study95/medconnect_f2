// billingAdminApi.js — Enterprise Admin Billing System API client
import axiosInstance from './axiosInstance'

const BASE = '/admin/billing'

// ===== 1. DASHBOARD & KPIS =====
export const getBillingDashboard = () => 
  axiosInstance.get(`${BASE}/dashboard`).then(res => res.data)

// ===== 2. PLANS & FEATURE MATRIX =====
export const getAdminPlans = (params) => 
  axiosInstance.get(`${BASE}/plans`, { params }).then(res => res.data)

export const getAdminPlan = (id) => 
  axiosInstance.get(`${BASE}/plans/${id}`).then(res => res.data)

export const createAdminPlan = (data) => 
  axiosInstance.post(`${BASE}/plans`, data).then(res => res.data)

export const updateAdminPlan = (id, data) => 
  axiosInstance.put(`${BASE}/plans/${id}`, data).then(res => res.data)

export const deleteAdminPlan = (id) => 
  axiosInstance.delete(`${BASE}/plans/${id}`).then(res => res.data)

export const getFeatureMatrix = () => 
  axiosInstance.get(`${BASE}/plans/feature-matrix`).then(res => res.data)

export const updateFeatureMatrix = (matrix) => 
  axiosInstance.post(`${BASE}/plans/feature-matrix`, { matrix: Array.isArray(matrix) ? matrix : matrix?.matrix }).then(res => res.data)

// ===== 3. SUBSCRIBERS & LIFECYCLE =====
export const getAdminSubscribers = (params) => 
  axiosInstance.get(`${BASE}/subscriptions`, { params }).then(res => res.data)

export const getAdminSubscriberDetails = (id) => 
  axiosInstance.get(`${BASE}/subscriptions/${id}`).then(res => res.data)

export const updateAdminSubscriber = (id, data) => 
  axiosInstance.patch(`${BASE}/subscriptions/${id}`, data).then(res => res.data)

export const cancelAdminSubscriber = (id, immediately = false) => 
  axiosInstance.post(`${BASE}/subscriptions/${id}/cancel`, { immediately }).then(res => res.data)

// ===== 4. INVOICES =====
export const getAdminInvoices = (params) => 
  axiosInstance.get(`${BASE}/invoices`, { params }).then(res => res.data)

export const getAdminInvoice = (id) => 
  axiosInstance.get(`${BASE}/invoices/${id}`).then(res => res.data)

export const markInvoicePaid = (id) => 
  axiosInstance.post(`${BASE}/invoices/${id}/mark-paid`).then(res => res.data)

export const voidInvoice = (id) => 
  axiosInstance.post(`${BASE}/invoices/${id}/void`).then(res => res.data)

export const regenerateInvoice = (id) => 
  axiosInstance.post(`${BASE}/invoices/${id}/regenerate`).then(res => res.data)

export const sendInvoiceEmail = (id) => 
  axiosInstance.post(`${BASE}/invoices/${id}/send-email`).then(res => res.data)

// ===== 5. PAYMENT TRANSACTIONS & FRAUD =====
export const getAdminTransactions = (params) => 
  axiosInstance.get(`${BASE}/transactions`, { params }).then(res => res.data)

export const getAdminTransaction = (id) => 
  axiosInstance.get(`${BASE}/transactions/${id}`).then(res => res.data)

export const verifyPaymentTransaction = (id, action, note = '') => 
  axiosInstance.post(`${BASE}/transactions/${id}/verify`, { action, note }).then(res => res.data)

// ===== 6. COUPONS =====
export const getAdminCoupons = (params) => 
  axiosInstance.get(`${BASE}/coupons`, { params }).then(res => res.data)

export const getAdminCoupon = (id) => 
  axiosInstance.get(`${BASE}/coupons/${id}`).then(res => res.data)

export const createAdminCoupon = (data) => 
  axiosInstance.post(`${BASE}/coupons`, data).then(res => res.data)

export const updateAdminCoupon = (id, data) => 
  axiosInstance.put(`${BASE}/coupons/${id}`, data).then(res => res.data)

export const deleteAdminCoupon = (id) => 
  axiosInstance.delete(`${BASE}/coupons/${id}`).then(res => res.data)

// ===== 7. BILLING SETTINGS =====
export const getBillingSettings = () => 
  axiosInstance.get(`${BASE}/settings`).then(res => res.data)

export const updateBillingSettings = (settings) => 
  axiosInstance.post(`${BASE}/settings`, { settings }).then(res => res.data)

// ===== 8. MANUAL BILLING & VERIFICATION (PHASE 4.4) =====
export const getAdminManualPayments = (params) => 
  axiosInstance.get(`${BASE}/manual-payments`, { params }).then(res => res.data)

export const getAdminManualPaymentDetails = (id) => 
  axiosInstance.get(`${BASE}/manual-payments/${id}`).then(res => res.data)

export const getAdminManualPaymentSlipUrl = (id) => 
  `${axiosInstance.defaults.baseURL || '/api/v1'}${BASE}/manual-payments/${id}/slip`

export const approveAdminManualPayment = (id, note) => 
  axiosInstance.post(`${BASE}/manual-payments/${id}/approve`, { note }).then(res => res.data)

export const rejectAdminManualPayment = (id, reason) => 
  axiosInstance.post(`${BASE}/manual-payments/${id}/reject`, { reason }).then(res => res.data)


// subscriptionApi.js — All subscription system API calls
import axiosInstance from './axiosInstance'

// ===== PUBLIC =====
export const getSubscriptionPackages = () => axiosInstance.get('/subscription/packages')

// ===== DOCTOR SUBSCRIPTION =====
export const validatePromoCode = (code) => axiosInstance.post('/subscription/validate-promo', { code })
export const purchaseSubscription = (data) => axiosInstance.post('/subscription/purchase', data)
export const getSubscriptionStatus = () => axiosInstance.get('/subscription/status')
export const getSubscriptionHistory = () => axiosInstance.get('/subscription/history')

// ===== DOCTOR NOTIFICATIONS =====
export const getNotifications = (params) => axiosInstance.get('/notifications', { params })
export const getPopupNotifications = () => axiosInstance.get('/notifications/popups')
export const getUnreadCount = () => axiosInstance.get('/notifications/unread-count')
export const markNotificationRead = (id) => axiosInstance.put(`/notifications/${id}/read`)
export const markAllNotificationsRead = () => axiosInstance.post('/notifications/mark-all-read')

// ===== ADMIN: PACKAGES =====
export const getAdminPackages = () => axiosInstance.get('/admin/packages')
export const createAdminPackage = (data) => axiosInstance.post('/admin/packages', data)
export const updateAdminPackage = (id, data) => axiosInstance.put(`/admin/packages/${id}`, data)
export const deleteAdminPackage = (id) => axiosInstance.delete(`/admin/packages/${id}`)

// ===== ADMIN: PROMO CODES =====
export const getAdminPromoCodes = () => axiosInstance.get('/admin/promo-codes')
export const createAdminPromoCode = (data) => axiosInstance.post('/admin/promo-codes', data)
export const updateAdminPromoCode = (id, data) => axiosInstance.put(`/admin/promo-codes/${id}`, data)
export const deleteAdminPromoCode = (id) => axiosInstance.delete(`/admin/promo-codes/${id}`)

// ===== ADMIN: TRIAL DAYS =====
export const getAdminTrialDays = () => axiosInstance.get('/admin/trial-days')
export const grantTrialDays = (data) => axiosInstance.post('/admin/trial-days', data)
export const deleteTrialDay = (id) => axiosInstance.delete(`/admin/trial-days/${id}`)

// ===== ADMIN: SUBSCRIPTIONS =====
export const getAdminSubscriptions = (params) => axiosInstance.get('/admin/subscriptions', { params })
export const updateAdminSubscription = (id, data) => axiosInstance.put(`/admin/subscriptions/${id}`, data)
export const deleteAdminSubscription = (id) => axiosInstance.delete(`/admin/subscriptions/${id}`)

// ===== ADMIN: MESSAGES =====
export const getAdminNotifications = () => axiosInstance.get('/admin/sent-notifications')
export const sendAdminNotification = (data) => axiosInstance.post('/admin/send-notification', data)
export const updateAdminNotification = (id, data) => axiosInstance.put(`/admin/notifications/${id}`, data)
export const deleteAdminNotification = (id) => axiosInstance.delete(`/admin/notifications/${id}`)

// ===== DOCTOR ENTERPRISE BILLING (PHASE 4.1) =====
export const getDoctorBillingOverview = () => 
  axiosInstance.get('/doctor/billing/overview').then(res => res.data)

export const getDoctorAvailablePlans = () => 
  axiosInstance.get('/doctor/billing/plans').then(res => res.data)

export const previewDoctorPlanChange = (planId, billingCycle = 'monthly') => 
  axiosInstance.post('/doctor/billing/preview-plan-change', { plan_id: planId, billing_cycle: billingCycle }).then(res => res.data)

export const changeDoctorPlan = (planId, billingCycle = 'monthly') => 
  axiosInstance.post('/doctor/billing/change-plan', { plan_id: planId, billing_cycle: billingCycle }).then(res => res.data)

export const cancelDoctorBillingSubscription = (immediately = false) => 
  axiosInstance.post('/doctor/billing/cancel', { immediately }).then(res => res.data)

export const emailDoctorInvoice = (invoiceId) => 
  axiosInstance.post(`/doctor/billing/invoices/${invoiceId}/email`).then(res => res.data)

export const downloadDoctorInvoice = (invoiceId) => 
  axiosInstance.get(`/doctor/billing/invoices/${invoiceId}/download`).then(res => res.data)

// ===== HOSPITAL ENTERPRISE BILLING (PHASE 4.2) =====
export const getHospitalBillingOverview = () => 
  axiosInstance.get('/hospital/billing/overview').then(res => res.data)

export const getHospitalAvailablePlans = () => 
  axiosInstance.get('/hospital/billing/plans').then(res => res.data)

export const previewHospitalPlanChange = (planId, billingCycle = 'monthly') => 
  axiosInstance.post('/hospital/billing/preview-plan-change', { plan_id: planId, billing_cycle: billingCycle }).then(res => res.data)

export const changeHospitalPlan = (planId, billingCycle = 'monthly') => 
  axiosInstance.post('/hospital/billing/change-plan', { plan_id: planId, billing_cycle: billingCycle }).then(res => res.data)

export const cancelHospitalBillingSubscription = (immediately = false) => 
  axiosInstance.post('/hospital/billing/cancel', { immediately }).then(res => res.data)

export const allocateHospitalDoctorSeat = (doctorId) => 
  axiosInstance.post('/hospital/billing/allocate-doctor', { doctor_id: doctorId }).then(res => res.data)

export const revokeHospitalDoctorSeat = (doctorId) => 
  axiosInstance.post('/hospital/billing/revoke-doctor', { doctor_id: doctorId }).then(res => res.data)

export const getHospitalInvoiceDownloadPayload = (invoiceId) => 
  axiosInstance.get(`/hospital/billing/invoices/${invoiceId}/download`).then(res => res.data)

export const emailHospitalInvoice = (invoiceId) => 
  axiosInstance.post(`/hospital/billing/invoices/${invoiceId}/email`).then(res => res.data)

// ===== ENTERPRISE CHECKOUT (PHASE 4.3) =====
export const getCheckoutSummary = (planId, billingCycle = 'monthly', couponCode = '') =>
  axiosInstance.get('/billing/checkout/summary', {
    params: { plan_id: planId, billing_cycle: billingCycle, coupon_code: couponCode || undefined }
  }).then(res => res.data)

export const applyCheckoutCoupon = (planId, couponCode, billingCycle = 'monthly') =>
  axiosInstance.post('/billing/checkout/apply-coupon', {
    plan_id: planId,
    coupon_code: couponCode,
    billing_cycle: billingCycle
  }).then(res => res.data)

export const createCheckoutSession = (data) =>
  axiosInstance.post('/billing/checkout/create-session', data).then(res => res.data)

export const cancelCheckoutSession = (sessionId) =>
  axiosInstance.post('/billing/checkout/cancel', { session_id: sessionId }).then(res => res.data)

export const getCheckoutInvoicePreview = (planId, billingCycle = 'monthly', couponCode = '', billingAddress = null) =>
  axiosInstance.get('/billing/checkout/invoice-preview', {
    params: {
      plan_id: planId,
      billing_cycle: billingCycle,
      coupon_code: couponCode || undefined,
      billing_address: billingAddress || undefined,
    }
  }).then(res => res.data)

// ===== MANUAL BILLING & OFFLINE PAYMENT (PHASE 4.4) =====
export const submitManualPayment = (formData) =>
  axiosInstance.post('/billing/manual-payment', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)



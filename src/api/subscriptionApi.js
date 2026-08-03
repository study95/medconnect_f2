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
export const deleteAdminNotification = (id) => axiosInstance.delete(`/admin/notifications/${id}`)

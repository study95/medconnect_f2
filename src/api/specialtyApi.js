import axiosInstance from './axiosInstance'

/**
 * Public Specialty APIs
 */
export const getSpecialties = (params = {}) =>
  axiosInstance.get('/specialties', { params })

export const getSpecialtyHub = (slug, district = null, upazila = null, params = {}) => {
  let url = `/specialties/${slug}`
  if (district) url += `/${district}`
  if (upazila) url += `/${upazila}`
  return axiosInstance.get(url, { params })
}

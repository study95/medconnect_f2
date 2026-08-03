import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getMediaUrl } from '../../../utils/mediaUtils'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  getDoctors, updateDoctor,
  getHospitals, updateHospital
} from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import debounce from 'lodash/debounce'

const TABS = {
  DOCTORS: 'doctors',
  HOSPITALS: 'hospitals',
  TELEMEDICINE: 'telemedicine'
}

export default function HighlightManagementPage() {
  const [activeTab, setActiveTab] = useState(TABS.DOCTORS)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])

  // Search state for "Add" feature
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [removingItem, setRemovingItem] = useState(null)
  const [processing, setProcessing] = useState(false)

  const loadItems = async () => {
    setLoading(true)
    try {
      let res
      if (activeTab === TABS.DOCTORS) {
        res = await getDoctors({ top_10: 1, per_page: 50 })
      } else if (activeTab === TABS.HOSPITALS) {
        res = await getHospitals({ top_10: 1, per_page: 50 })
      } else if (activeTab === TABS.TELEMEDICINE) {
        res = await getDoctors({ telemedicine: 1, per_page: 50 })
      }

      // Handle different response formats (DoctorResource vs Hospital pagination)
      const data = res.data.data?.data || res.data.data || []
      setItems(data)
    } catch (err) {
      console.error('Highlight Load Error:', err)
      toast.error('Failed to load highlighted items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [activeTab])

  // Debounced search for adding new items
  const handleSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) {
        setSearchResults([])
        return
      }
      setSearching(true)
      try {
        let res
        if (activeTab === TABS.HOSPITALS) {
          res = await getHospitals({ search: query, per_page: 5 })
        } else {
          res = await getDoctors({ search: query, per_page: 5 })
        }

        const data = res.data.data?.data || res.data.data || []
        const existingIds = items.map(i => i.id)
        setSearchResults(data.filter(item => !existingIds.includes(item.id)))
      } catch (err) {
        console.error('Highlight Search Error:', err)
      } finally {
        setSearching(false)
      }
    }, 500),
    [activeTab, items]
  )

  useEffect(() => {
    handleSearch(searchQuery)
  }, [searchQuery, handleSearch])

  const handleAdd = async (item) => {
    try {
      const formData = new FormData()
      if (activeTab === TABS.HOSPITALS) {
        formData.append('top_10_hospital', 'yes')
        formData.append('_method', 'PUT')
        await updateHospital(item.id, formData)
      } else if (activeTab === TABS.DOCTORS) {
        formData.append('top_10_doctor', 'yes')
        formData.append('_method', 'PUT')
        await updateDoctor(item.id, formData)
      } else if (activeTab === TABS.TELEMEDICINE) {
        formData.append('available_telemedicine', 'yes')
        formData.append('_method', 'PUT')
        await updateDoctor(item.id, formData)
      }
      toast.success('Added to highlights successfully')
      setSearchQuery('')
      setShowSearch(false)
      loadItems()
    } catch (err) {
      toast.error('Failed to add item')
    }
  }

  const handleRemove = async () => {
    if (!removingItem) return
    setProcessing(true)
    try {
      const formData = new FormData()
      if (activeTab === TABS.HOSPITALS) {
        formData.append('top_10_hospital', 'no')
        formData.append('_method', 'PUT')
        await updateHospital(removingItem.id, formData)
      } else if (activeTab === TABS.DOCTORS) {
        formData.append('top_10_doctor', 'no')
        formData.append('_method', 'PUT')
        await updateDoctor(removingItem.id, formData)
      } else if (activeTab === TABS.TELEMEDICINE) {
        formData.append('available_telemedicine', 'no')
        formData.append('_method', 'PUT')
        await updateDoctor(removingItem.id, formData)
      }
      toast.success('Removed from highlights')
      loadItems()
    } catch (err) {
      toast.error('Failed to remove item')
    } finally {
      setProcessing(false)
      setRemovingItem(null)
    }
  }

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Highlight Management</h2>
          <p className="admin-page-subtitle">Manage Top 10 Doctors, Hospitals, and Telemedicine specialists</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, background: 'var(--admin-card-bg)', padding: '6px', borderRadius: 12, border: '1px solid var(--admin-border)', width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab(TABS.DOCTORS)}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700,
            background: activeTab === TABS.DOCTORS ? 'var(--admin-primary)' : 'transparent',
            color: activeTab === TABS.DOCTORS ? 'white' : 'var(--admin-text-muted)',
            transition: 'all 0.2s'
          }}
        >
          ⭐ Top 10 Doctors
        </button>
        <button
          onClick={() => setActiveTab(TABS.HOSPITALS)}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700,
            background: activeTab === TABS.HOSPITALS ? 'var(--admin-primary)' : 'transparent',
            color: activeTab === TABS.HOSPITALS ? 'white' : 'var(--admin-text-muted)',
            transition: 'all 0.2s'
          }}
        >
          🏥 Top 10 Hospitals
        </button>
        <button
          onClick={() => setActiveTab(TABS.TELEMEDICINE)}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700,
            background: activeTab === TABS.TELEMEDICINE ? '#4F46E5' : 'transparent',
            color: activeTab === TABS.TELEMEDICINE ? 'white' : 'var(--admin-text-muted)',
            transition: 'all 0.2s'
          }}
        >
          📹 Telemedicine
        </button>
      </div>

      <div className="admin-card" style={{ overflow: 'visible' }}>
        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'visible' }}>
          <h3 style={{ margin: 0 }}>
            {activeTab === TABS.DOCTORS && 'Featured Top 10 Doctors'}
            {activeTab === TABS.HOSPITALS && 'Featured Top 10 Hospitals'}
            {activeTab === TABS.TELEMEDICINE && 'Telemedicine Specialists'}
          </h3>

          <div style={{ position: 'relative', zIndex: 1000 }} ref={searchRef}>
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => setShowSearch(!showSearch)}
            >
              ➕ Add {activeTab === TABS.HOSPITALS ? 'Hospital' : 'Doctor'}
            </button>

            {showSearch && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 350,
                background: 'var(--admin-card-bg)', borderRadius: 16, boxShadow: 'var(--admin-shadow-lg)',
                padding: 16, zIndex: 1001, border: '1px solid var(--admin-border)'
              }}>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder={`Search for a ${activeTab === TABS.HOSPITALS ? 'hospital' : 'doctor'}...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                />

                <div style={{ marginTop: 12, maxHeight: 300, overflowY: 'auto' }}>
                  {searching ? (
                    <div style={{ padding: 12, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(item => (
                      <div
                        key={item.id}
                        style={{
                          padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          cursor: 'pointer', transition: 'background 0.2s'
                        }}
                        className="search-result-item"
                        onClick={() => handleAdd(item)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--admin-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                            {activeTab === TABS.HOSPITALS ? '🏥' : '👨‍⚕️'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>{item.specialty?.name || item.district?.name}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: '#00A88C', fontWeight: 700 }}>Add ➕</span>
                      </div>
                    ))
                  ) : searchQuery.length >= 2 ? (
                    <div style={{ padding: 12, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No matches found</div>
                  ) : (
                    <div style={{ padding: 12, textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>Type name to search</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="admin-card-body">
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <div className="admin-spinner" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: '#64748B' }}>Syncing highlighted items...</p>
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
              <h4 style={{ fontWeight: 800, marginBottom: 8 }}>List is currently empty</h4>
              <p style={{ color: '#64748B' }}>Click the "Add" button to feature your first {activeTab === TABS.HOSPITALS ? 'hospital' : 'doctor'}.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item Details</th>
                    <th>Location / Specialty</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F1F5F9', overflow: 'hidden' }}>
                            {activeTab === TABS.HOSPITALS ? (
                              item.photo_url ? <img src={getMediaUrl(item.photo_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏥</div>
                            ) : (
                              item.photo ? <img src={getMediaUrl(item.photo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👨‍⚕️</div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1A1D2E' }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>ID: #{item.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {activeTab === TABS.HOSPITALS ? (
                          <>
                            <div style={{ fontWeight: 500 }}>{item.district?.name}</div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>{item.district?.division?.name}</div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontWeight: 500 }}>{item.specialty?.name}</div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>{item.workplace || 'General Practitioner'}</div>
                          </>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <Link
                            to={activeTab === TABS.HOSPITALS ? `/admin/hospitals/edit/${item.id}` : `/admin/doctors/edit/${item.id}`}
                            className="admin-btn admin-btn-outline admin-btn-sm"
                          >
                            ✏️ Edit
                          </Link>
                          <button
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => setRemovingItem(item)}
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <DeleteModal
        show={!!removingItem}
        title="Remove from Highlights"
        message={`Are you sure you want to remove "${removingItem?.name}" from this list? This will not delete the record, just hide it from the featured section.`}
        onConfirm={handleRemove}
        onCancel={() => setRemovingItem(null)}
        loading={processing}
        confirmText="Remove"
      />

      <style>{`
        .search-result-item:hover {
          background: #F8FAFB;
        }
      `}</style>
    </div>
  )
}

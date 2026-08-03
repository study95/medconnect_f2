// WHY THIS FILE EXISTS:
// This is the smart search bar used on Home and Doctors pages.
// It has 4 filters that work together:
//   1. Division dropdown  → when changed, Districts reload automatically
//   2. District dropdown  → populated based on selected division
//   3. Specialty dropdown → independent, loaded once
//   4. Text search        → manual keyword (doctor name etc.)
//
// When user clicks Search, onSearch() is called with all filter values.
// The parent page then passes those values to the API.

import React, { useState, useEffect } from 'react'
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap'
import { getSpecialties } from '../../api/doctorApi'
import useLocations from '../../hooks/useLocations'


const SearchFilter = React.memo(({ onSearch, compact = false }) => {
  const {
    divisions, districts, upazilas, unions,
    selectedDivision, selectedDistrict, selectedUpazila, selectedUnion,
    setSelectedDivision, setSelectedDistrict, setSelectedUpazila, setSelectedUnion,
    loadingDistricts, loadingUpazilas, loadingUnions
  } = useLocations()



  const [specialties, setSpecialties]           = useState([])
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [searchText, setSearchText]             = useState('')
  const [telemedicine, setTelemedicine]         = useState(false)

  // Load specialties once
  useEffect(() => {
    getSpecialties()
      .then((res) => setSpecialties(res.data?.data || res.data || []))
      .catch(() => setSpecialties([]))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = {}
    if (selectedDivision) params.division_id = selectedDivision
    if (selectedDistrict) params.district_id = selectedDistrict
    if (selectedUpazila) params.upazila_id = selectedUpazila
    if (selectedUnion) params.union_id = selectedUnion
    if (selectedSpecialty) params.specialty_id = selectedSpecialty
    if (searchText.trim()) params.search = searchText.trim()
    if (telemedicine) params.telemedicine = 1
    onSearch(params)
  }

  const handleClear = () => {
    setSelectedDivision('')
    setSelectedDistrict('')
    setSelectedUpazila('')
    setSelectedUnion('')
    setSelectedSpecialty('')
    setSearchText('')
    setTelemedicine(false)
    onSearch({}) // reset to show all doctors
  }

  const inputStyle = {
    borderRadius: 16,
    border: '1.5px solid var(--mc-border)',
    padding: '12px 16px 12px 42px',
    fontSize: 14,
    color: 'var(--mc-text)',
    background: 'var(--mc-white)',

    outline: 'none',
    width: '100%',
    height: 54,
    transition: '0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
    fontWeight: 700,
    boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
  }

  const focusStyle = (e) => {
    e.target.style.borderColor = '#00A88C'
    e.target.style.boxShadow = '0 10px 25px rgba(0, 168, 140, 0.1)'
    e.target.style.transform = 'translateY(-2px)'
  }

  const blurStyle = (e) => {
    e.target.style.borderColor = 'var(--mc-border)'
    e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)'
    e.target.style.transform = 'translateY(0)'
  }


  const InputWrapper = ({ children, icon }) => (
    <div style={{ position: 'relative', flex: 1, minWidth: compact ? 160 : 200 }}>
       <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, zIndex: 5, color: '#94A3B8' }}>{icon}</span>
       {children}
    </div>
  )

  return (
    <form onSubmit={handleSearch} style={{ width: '100%' }}>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 16, 
        alignItems: 'center',
        background: compact ? 'transparent' : 'var(--mc-white)',
        padding: compact ? 0 : '16px',
        borderRadius: compact ? 0 : 24,
        boxShadow: compact ? 'none' : '0 20px 50px rgba(0, 168, 140, 0.05)',
        border: compact ? 'none' : '1px solid var(--mc-border)'
      }}>

        {/* Division */}
        <InputWrapper icon="🗺️">
          <select
            style={inputStyle}
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            onFocus={focusStyle} onBlur={blurStyle}
          >
            <option value="">বিভাগ</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>{d.name?.bn || d.name?.en || d.name}</option>
            ))}
          </select>
        </InputWrapper>

        {/* District */}
        <InputWrapper icon="📍">
          <select
            style={{ ...inputStyle, opacity: !selectedDivision ? 0.6 : 1 }}
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={!selectedDivision}
            onFocus={focusStyle} onBlur={blurStyle}
          >
            <option value="">জেলা</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name?.bn || d.name?.en || d.name}</option>
            ))}
          </select>
          {loadingDistricts && (
            <Spinner
              animation="border" size="sm"
              style={{ position: 'absolute', right: 12, top: 20, color: '#00A88C', width: 14, height: 14 }}
            />
          )}
        </InputWrapper>

        {/* Upazila */}
        <InputWrapper icon="🏙️">
          <select
            style={{ ...inputStyle, opacity: !selectedDistrict ? 0.6 : 1 }}
            value={selectedUpazila}
            onChange={(e) => setSelectedUpazila(e.target.value)}
            disabled={!selectedDistrict}
            onFocus={focusStyle} onBlur={blurStyle}
          >
            <option value="">উপজেলা</option>
            {upazilas.map((u) => (
              <option key={u.id} value={u.id}>{u.name?.bn || u.name?.en || u.name}</option>
            ))}
          </select>
          {loadingUpazilas && (
            <Spinner
              animation="border" size="sm"
              style={{ position: 'absolute', right: 12, top: 20, color: '#00A88C', width: 14, height: 14 }}
            />
          )}
        </InputWrapper>

        {/* Union */}
        <InputWrapper icon="🏘️">
          <select
            style={{ ...inputStyle, opacity: !selectedUpazila ? 0.6 : 1 }}
            value={selectedUnion}
            onChange={(e) => setSelectedUnion(e.target.value)}
            disabled={!selectedUpazila}
            onFocus={focusStyle} onBlur={blurStyle}
          >
            <option value="">ইউনিয়ন</option>
            {unions.map((u) => (
              <option key={u.id} value={u.id}>{u.name?.bn || u.name?.en || u.name}</option>
            ))}
          </select>
          {loadingUnions && (
            <Spinner
              animation="border" size="sm"
              style={{ position: 'absolute', right: 12, top: 20, color: '#00A88C', width: 14, height: 14 }}
            />
          )}
        </InputWrapper>

        {/* Specialty */}
        <InputWrapper icon="🩺">
          <select
            style={inputStyle}
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            onFocus={focusStyle} onBlur={blurStyle}
          >
            <option value="">বিশেষজ্ঞতা</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>{s.name?.bn || s.name?.en || s.name}</option>
            ))}
          </select>
        </InputWrapper>

        {/* Manual text search */}
        <InputWrapper icon="🔍">
          <input
            type="text"
            placeholder="নাম দিয়ে খুঁজুন..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={inputStyle}
            onFocus={focusStyle} onBlur={blurStyle}
          />

        </InputWrapper>

        {/* Telemedicine Toggle */}
        <div 
          onClick={() => setTelemedicine(!telemedicine)}
          style={{
            height: 54, padding: '0 20px', borderRadius: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            border: telemedicine ? '2px solid #4F46E5' : '1.5px solid var(--mc-border)',
            background: telemedicine ? '#EEF2FF' : 'var(--mc-white)',
            transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}
        >
          <span style={{ fontSize: 18 }}>📹</span>
          <span style={{ 
            fontSize: 13, fontWeight: 700, 
            color: telemedicine ? '#4F46E5' : '#64748B' 
          }}>
            ভিডিও কল সেবা
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button
            type="submit"
            style={{
              height: 54, borderRadius: 16,
              background: '#00A88C', border: 'none',
              color: 'white', fontWeight: 950, fontSize: 13,
              padding: '0 36px', cursor: 'pointer',
              transition: '0.4s', boxShadow: '0 10px 25px rgba(0,168,140,0.3)',
              letterSpacing: '0.1em'
            }}
            onMouseEnter={(e) => {e.target.style.background = '#008a74'; e.target.style.transform='translateY(-2px)'}}
            onMouseLeave={(e) => {e.target.style.background = '#00A88C'; e.target.style.transform='translateY(0)'}}
          >
            খুঁজুন
          </button>

          
          {(selectedDivision || selectedDistrict || selectedUpazila || selectedUnion || selectedSpecialty || searchText) && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                height: 54, width: 54, borderRadius: 16, border: '1.5px solid var(--mc-border)',
                background: 'var(--mc-white)', color: 'var(--mc-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: '0.4s'
              }}
              onMouseEnter={(e) => {e.target.style.background = 'var(--mc-bg)'; e.target.style.borderColor='#00A88C50'}}
              onMouseLeave={(e) => {e.target.style.background = 'var(--mc-white)'; e.target.style.borderColor='var(--mc-border)'}}
            >

              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>
    </form>
  )
})

export default SearchFilter

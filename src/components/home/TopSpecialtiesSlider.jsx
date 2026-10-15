import React, { useEffect, useState, useMemo, memo } from 'react'
import { Container, Modal, Form, InputGroup, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { getSpecialties } from '../../api/doctorApi'
import { useTranslation } from 'react-i18next'
import { translateMetadata } from '../../utils/translationUtils'
import {
  IconStethoscope, IconBrain, IconEye,
  IconScissors, IconActivity, IconDroplet,
  IconChevronRight, IconSearch, IconX, IconPlus
} from '@tabler/icons-react'

// ─── Custom Medical SVG Icons (Matching Reference Design 2) ──────────────────
const IconRibbonCustom = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 20l5.5 -10.5a3.5 3.5 0 1 1 5 3.5l-4.5 7" />
    <path d="M17 20l-5.5 -10.5a3.5 3.5 0 1 0 -5 3.5l4.5 7" />
  </svg>
)
const IconHeartPulse = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
    <path d="M7 12h2.5l1.5 -3l2 6l1.5 -3h2.5" />
  </svg>
)

const IconBabyFace = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="13" r="7.5" />
    <path d="M12 5.5c-.8 -1.8 .8 -2.5 .8 -2.5" />
    <circle cx="9.5" cy="12.5" r="1.1" fill={color} />
    <circle cx="14.5" cy="12.5" r="1.1" fill={color} />
    <path d="M10 16c.8 .7 2.2 .7 3 0" />
    <path d="M4.5 12c-1.2 0 -1.5 .8 -1.5 1.5s.8 1.5 1.5 1.5" />
    <path d="M19.5 12c1.2 0 1.5 .8 1.5 1.5s-.8 1.5 -1.5 1.5" />
  </svg>
)

const IconWoman = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
    <path d="M8 8a4 4 0 0 0 8 0" />
    <path d="M7.5 7c-.8 2.5 -1.2 5 -.8 7.5" />
    <path d="M16.5 7c.8 2.5 1.2 5 .8 7.5" />
  </svg>
)

const IconSkin = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v9" />
    <path d="M9 7l3 5l3 -5" />
    <path d="M3 18c3 -1.8 6 1.8 9 0s6 1.8 9 0" />
    <circle cx="6" cy="10" r="1" fill={color} />
    <circle cx="18" cy="10" r="1" fill={color} />
    <circle cx="8" cy="6" r="1" fill={color} />
    <circle cx="16" cy="6" r="1" fill={color} />
  </svg>
)

const IconENT = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3.5c3 1.5 4 4.5 4 7.5c0 4.5 -2.5 7.5 -6 8.5c-2.5 .7 -4 .2 -5 -1.5" />
    <path d="M10 5.5a4.5 4.5 0 0 0 -4.5 4.5c0 3 2 5.5 4.5 6.5" />
    <path d="M8 12a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-1a2 2 0 0 1 -2 -2z" />
  </svg>
)

const IconStomach = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2v4c0 1.5 -.8 3 -2 4c-2 1.6 -3 3.5 -3 5.5c0 3.3 2.7 6 6 6c3 0 5.5 -2.2 5.5 -5.2c0 -3 -1.8 -5.3 -3.5 -6.8l-1 -.9" />
    <path d="M15.5 19.5c1 .5 2 1.5 2.5 2.5" />
  </svg>
)

const IconLungsCustom = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v7" />
    <path d="M9 10l3 -2l3 2" />
    <path d="M12 10c-3 0 -6 1 -6 5c0 4 2 6 5 6c1 0 1 -.5 1 -2v-9" />
    <path d="M12 10c3 0 6 1 6 5c0 4 -2 6 -5 6c-1 0 -1 -.5 -1 -2v-9" />
  </svg>
)

const IconBoneCustom = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3a3 3 0 0 1 2.8 4.1l2.1 2.1a3 3 0 0 1 -4.2 4.2l-2.1 -2.1a3 3 0 0 1 -4.1 -2.8" />
    <path d="M9 21a3 3 0 0 1 -2.8 -4.1l-2.1 -2.1a3 3 0 0 1 4.2 -4.2l2.1 2.1a3 3 0 0 1 4.1 2.8" />
    <path d="M8.5 15.5l7 -7" />
  </svg>
)

const IconKidneys = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 7c-2 0 -3.5 1.8 -3.5 4.5s1.5 5.5 3.5 5.5c2 0 2.5 -2 2.5 -3.5c0 -1.5 -.5 -2.5 -1 -3.5c.5 -1.5 0 -3 -1.5 -3z" />
    <path d="M17.5 7c2 0 3.5 1.8 3.5 4.5s-1.5 5.5 -3.5 5.5c-2 0 -2.5 -2 -2.5 -3.5c0 -1.5 .5 -2.5 1 -3.5c-.5 -1.5 0 -3 1.5 -3z" />
    <path d="M8.5 13.5h7" />
  </svg>
)

const IconLiver = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14c-1 -2.5 -.5 -5.5 1.5 -7.5C8 4 12.5 3.5 16 5c3 1.3 4.5 4 4 7c-.6 3.5 -4 7 -8 7c-3.5 0 -6.8 -2 -8 -5z" />
    <path d="M14 9c-1 2 -2 4 -4.5 5" />
  </svg>
)

const IconTooth = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3c-2.5 0 -4 2 -4 5c0 3 1.5 5 2.5 8s1.5 5 2.5 5c1 0 1.5 -2 2 -4c.5 -2 1 -2 2 -2s1.5 0 2 2c.5 2 1 4 2 4s1.5 -2 2.5 -5c2.5 -5 2.5 -8 2.5 -8c0 -3 -1.5 -5 -4 -5c-2 0 -3 1.5 -4 1.5S9 3 7 3z" />
  </svg>
)

const IconUrology = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="6" r="2.2" />
    <path d="M12 8.2v4.3" />
    <path d="M8 14.5c0 3.3 1.8 5.5 4 5.5s4 -2.2 4 -5.5" />
    <path d="M7 11.5c0 2 1.5 3 5 3s5 -1 5 -3" />
    <path d="M12 20v2" />
  </svg>
)

// ─── Metadata & Styling Map (Exact Reference 2 Scheme) ────────────────────────
const SPECIALTY_META = {
  medicine: {
    title: { bn: 'মেডিসিন', en: 'Medicine' },
    desc: { bn: 'সাধারণ রোগ ও অভ্যন্তরীণ চিকিৎসা', en: 'General and internal medicine care' },
    icon: IconStethoscope,
    color: '#059669',
    bg: '#E8F8F2',
    border: '#A7F3D0'
  },
  cardiology: {
    title: { bn: 'হৃদরোগ', en: 'Cardiology' },
    desc: { bn: 'হৃদযন্ত্র ও রক্তনালীর রোগের চিকিৎসা', en: 'Heart & vascular diseases care' },
    icon: IconHeartPulse,
    color: '#E11D48',
    bg: '#FFE4E6',
    border: '#FECDD3'
  },
  pediatrics: {
    title: { bn: 'শিশু রোগ', en: 'Pediatrics' },
    desc: { bn: 'শিশুদের সকল রোগের চিকিৎসা', en: 'Specialist care for all child illnesses' },
    icon: IconBabyFace,
    color: '#0284C7',
    bg: '#E0F2FE',
    border: '#BAE6FD'
  },
  gynecology: {
    title: { bn: 'স্ত্রী ও প্রসূতি রোগ', en: 'Gynecology & Obs' },
    desc: { bn: 'নারীদের স্বাস্থ্য ও প্রসূতি চিকিৎসা', en: "Women's & maternal healthcare" },
    icon: IconWoman,
    color: '#7C3AED',
    bg: '#EDE9FE',
    border: '#DDD6FE'
  },
  dermatology: {
    title: { bn: 'চর্ম ও যৌনরোগ', en: 'Dermatology' },
    desc: { bn: 'চর্ম, এলার্জি ও যৌনরোগের চিকিৎসা', en: 'Skin, allergy and STD treatment' },
    icon: IconSkin,
    color: '#EA580C',
    bg: '#FFEDD5',
    border: '#FED7AA'
  },
  ent: {
    title: { bn: 'নাক, কান ও গলা রোগ', en: 'ENT' },
    desc: { bn: 'নাক, কান, গলা ও ঘাড়ের বিশেষজ্ঞ', en: 'Ear, nose, throat and neck care' },
    icon: IconENT,
    color: '#6366F1',
    bg: '#EEF2FF',
    border: '#C7D2FE'
  },
  gastroenterology: {
    title: { bn: 'গ্যাস্ট্রোএন্টারোলজি', en: 'Gastroenterology' },
    desc: { bn: 'পাকস্থলী, লিভার ও পরিপাকতন্ত্রের চিকিৎসা', en: 'Stomach, liver & digestive treatment' },
    icon: IconStomach,
    color: '#059669',
    bg: '#E8F8F2',
    border: '#A7F3D0'
  },
  pulmonology: {
    title: { bn: 'শ্বাসরোগ', en: 'Pulmonology' },
    desc: { bn: 'ফুসফুস ও শ্বাসতন্ত্রের রোগের চিকিৎসা', en: 'Lungs & respiratory diseases care' },
    icon: IconLungsCustom,
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE'
  },
  orthopedic: {
    title: { bn: 'অর্থোপেডিক্স', en: 'Orthopedics' },
    desc: { bn: 'হাড়, জয়েন্ট ও পেশীর চিকিৎসা', en: 'Bone, joint & muscle treatments' },
    icon: IconBoneCustom,
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A'
  },
  psychiatry: {
    title: { bn: 'মানসিক রোগ', en: 'Psychiatry' },
    desc: { bn: 'মানসিক স্বাস্থ্য ও স্নায়বিক চিকিৎসা', en: 'Mental & psychological health care' },
    icon: IconBrain,
    color: '#E11D48',
    bg: '#FFE4E6',
    border: '#FECDD3'
  },
  nephrology: {
    title: { bn: 'নেফ্রোলজি', en: 'Nephrology' },
    desc: { bn: 'কিডনি ও মূত্রতন্ত্রের চিকিৎসা', en: 'Kidney and urinary system care' },
    icon: IconKidneys,
    color: '#0D9488',
    bg: '#CCFBF1',
    border: '#99F6E4'
  },
  hepatology: {
    title: { bn: 'লিভার ও পরিপাকতন্ত্র', en: 'Hepatology' },
    desc: { bn: 'লিভার, পাচনতন্ত্র ও পেটের সমস্যা', en: 'Liver & gastrointestinal treatment' },
    icon: IconLiver,
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A'
  },
  oncology: {
    title: { bn: 'ক্যান্সার রোগ', en: 'Oncology' },
    desc: { bn: 'ক্যান্সার রোগের বিশেষজ্ঞ চিকিৎসা', en: 'Cancer & oncology specialist care' },
    icon: IconRibbonCustom,
    color: '#7C3AED',
    bg: '#EDE9FE',
    border: '#DDD6FE'
  },
  ophthalmology: {
    title: { bn: 'চক্ষু', en: 'Ophthalmology' },
    desc: { bn: 'চোখ ও দৃষ্টিসংশ্লিষ্ট রোগের চিকিৎসা', en: 'Eye care and vision treatment' },
    icon: IconEye,
    color: '#1D4ED8',
    bg: '#DBEAFE',
    border: '#BFDBFE'
  },
  dental: {
    title: { bn: 'দাঁত ও মুখ', en: 'Dentistry' },
    desc: { bn: 'দাঁত, মুখগহ্বর ও মাড়ির চিকিৎসা', en: 'Dental and oral health care' },
    icon: IconTooth,
    color: '#059669',
    bg: '#E8F8F2',
    border: '#A7F3D0'
  },
  urology: {
    title: { bn: 'ইউরোলজি', en: 'Urology' },
    desc: { bn: 'মূত্রতন্ত্র ও পুরুষ স্বাস্থ্য বিষয়ক চিকিৎসা', en: "Urinary tract & men's health" },
    icon: IconUrology,
    color: '#E11D48',
    bg: '#FFE4E6',
    border: '#FECDD3'
  },
  neurology: {
    title: { bn: 'স্নায়ুরোগ (নিউরোলজি)', en: 'Neurology' },
    desc: { bn: 'মস্তিষ্ক ও স্নায়ু রোগের উন্নত চিকিৎসা', en: 'Brain & nervous system disorders' },
    icon: IconBrain,
    color: '#6366F1',
    bg: '#EEF2FF',
    border: '#C7D2FE'
  },
  diabetes: {
    title: { bn: 'ডায়াবেটিস ও হরমোন', en: 'Diabetology' },
    desc: { bn: 'হরমোন ও ডায়াবেটিস বিশেষজ্ঞ চিকিৎসা', en: 'Diabetes & endocrine care' },
    icon: IconDroplet,
    color: '#0284C7',
    bg: '#E0F2FE',
    border: '#BAE6FD'
  },
  surgery: {
    title: { bn: 'জেনারেল সার্জারি', en: 'General Surgery' },
    desc: { bn: 'অভিজ্ঞ সার্জন ও আধুনিক চিকিৎসা সেবা', en: 'Advanced surgical care' },
    icon: IconScissors,
    color: '#0D9488',
    bg: '#CCFBF1',
    border: '#99F6E4'
  }
}

// Helper to look up metadata
function getSpecialtyMeta(name = '') {
  const lower = name.toLowerCase()

  // 1. English direct keywords
  if (lower.includes('cardio') || lower.includes('heart')) return SPECIALTY_META.cardiology
  if (lower.includes('pediatric') || lower.includes('child')) return SPECIALTY_META.pediatrics
  if (lower.includes('gynecol') || lower.includes('obstetric')) return SPECIALTY_META.gynecology
  if (lower.includes('dermatol') || lower.includes('skin')) return SPECIALTY_META.dermatology
  if (lower.includes('ent') || lower.includes('ear') || lower.includes('throat')) return SPECIALTY_META.ent
  if (lower.includes('gastro')) return SPECIALTY_META.gastroenterology
  if (lower.includes('pulmon') || lower.includes('respiratory') || lower.includes('chest')) return SPECIALTY_META.pulmonology
  if (lower.includes('orthoped')) return SPECIALTY_META.orthopedic
  if (lower.includes('psychiat') || lower.includes('mental')) return SPECIALTY_META.psychiatry
  if (lower.includes('nephrol') || lower.includes('kidney')) return SPECIALTY_META.nephrology
  if (lower.includes('hepatol') || lower.includes('liver')) return SPECIALTY_META.hepatology
  if (lower.includes('oncol') || lower.includes('cancer')) return SPECIALTY_META.oncology
  if (lower.includes('ophthal') || lower.includes('eye')) return SPECIALTY_META.ophthalmology
  if (lower.includes('dent')) return SPECIALTY_META.dental
  if (lower.includes('urol')) return SPECIALTY_META.urology
  if (lower.includes('neuro')) return SPECIALTY_META.neurology
  if (lower.includes('diabet') || lower.includes('endocrin')) return SPECIALTY_META.diabetes
  if (lower.includes('surg')) return SPECIALTY_META.surgery
  if (lower.includes('med')) return SPECIALTY_META.medicine

  // 2. Bengali keyword matching
  if (lower.includes('মেডিসিন')) return SPECIALTY_META.medicine
  if (lower.includes('হৃদরোগ') || lower.includes('হার্ট')) return SPECIALTY_META.cardiology
  if (lower.includes('শিশু')) return SPECIALTY_META.pediatrics
  if (lower.includes('স্ত্রী') || lower.includes('প্রসূতি') || lower.includes('গাইনি')) return SPECIALTY_META.gynecology
  if (lower.includes('চর্ম') || lower.includes('যৌন') || lower.includes('এলার্জি')) return SPECIALTY_META.dermatology
  if (lower.includes('নাক') || lower.includes('কান') || lower.includes('গলা')) return SPECIALTY_META.ent
  if (lower.includes('গ্যাস্ট্রো') || lower.includes('পরিপাক') || lower.includes('পাকস্থলী')) return SPECIALTY_META.gastroenterology
  if (lower.includes('শ্বাস') || lower.includes('বক্ষ') || lower.includes('ফুসফুস')) return SPECIALTY_META.pulmonology
  if (lower.includes('অর্থোপেডিক') || lower.includes('হাড়') || lower.includes('হাড়')) return SPECIALTY_META.orthopedic
  if (lower.includes('মানসিক') || lower.includes('মনোরোগ')) return SPECIALTY_META.psychiatry
  if (lower.includes('কিডনি') || lower.includes('নেফ্রো')) return SPECIALTY_META.nephrology
  if (lower.includes('লিভার')) return SPECIALTY_META.hepatology
  if (lower.includes('ক্যান্সার') || lower.includes('অনকো')) return SPECIALTY_META.oncology
  if (lower.includes('চোখ') || lower.includes('চক্ষু')) return SPECIALTY_META.ophthalmology
  if (lower.includes('দাঁত') || lower.includes('ডেন্টাল') || lower.includes('মুখ')) return SPECIALTY_META.dental
  if (lower.includes('ইউরোলজি') || lower.includes('মূত্র')) return SPECIALTY_META.urology
  if (lower.includes('স্নায়ু') || lower.includes('নিউরো')) return SPECIALTY_META.neurology
  if (lower.includes('ডায়াবেটিস') || lower.includes('হরমোন')) return SPECIALTY_META.diabetes
  if (lower.includes('সার্জারি')) return SPECIALTY_META.surgery

  // Default fallback
  return {
    title: { bn: name, en: name },
    desc: { bn: 'বিশেষজ্ঞ চিকিৎসা ও উন্নত সেবা', en: 'Specialist healthcare & medical treatment' },
    icon: IconStethoscope,
    color: '#059669',
    bg: '#E8F8F2',
    border: '#A7F3D0'
  }
}

// ─── Specialty Card Component (Reference Image 2) ────────────────────────────
function SpecCard({ spec, language, t, navigate }) {
  const meta = useMemo(() => getSpecialtyMeta(spec.name || spec.name_bn || ''), [spec.name, spec.name_bn])
  const IconComp = meta.icon

  // 100% Dynamic Name Resolution from API / Database
  const displayName = useMemo(() => {
    if (language === 'bn' && spec.name_bn) {
      return spec.name_bn
    }
    const raw = spec.name || spec.name_bn || ''
    const cleanRaw = raw.replace(/^spec_/, '')
    const translated = translateMetadata(cleanRaw, language, t)
    if (translated && translated !== cleanRaw) {
      return translated
    }
    if (language === 'bn' && meta.title?.bn) {
      return meta.title.bn
    }
    if (language === 'en' && meta.title?.en) {
      return meta.title.en
    }
    return cleanRaw || raw
  }, [spec, language, t, meta])

  const desc = (language === 'bn' ? meta.desc?.bn : meta.desc?.en) || (language === 'bn' ? 'বিশেষজ্ঞ চিকিৎসা ও সেবা' : 'Expert medical care')

  return (
    <div
      onClick={() => navigate(`/doctors?specialty_id=${spec.id}`)}
      className="tss-spec-card"
      style={{
        '--card-accent': meta.color,
        '--card-bg': meta.bg,
        '--card-border': meta.border
      }}
    >
      {/* 1. Left Icon Container */}
      <div className="tss-spec-icon-badge">
        <IconComp size={24} color={meta.color} />
      </div>

      {/* 2. Middle Content Info */}
      <div className="tss-spec-info">
        <h4 className="tss-spec-title" title={displayName}>
          {displayName}
        </h4>
        <p className="tss-spec-desc" title={desc}>
          {desc}
        </p>
      </div>

      {/* 3. Right Chevron Action Badge */}
      <div className="tss-spec-arrow">
        <IconChevronRight size={17} stroke={2.5} color={meta.color} />
      </div>
    </div>
  )
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="tss-spec-skeleton placeholder-glow">
      <div className="placeholder tss-skel-circle" />
      <div className="d-flex flex-column flex-grow-1 gap-2">
        <span className="placeholder col-8" style={{ height: 16, borderRadius: 6 }} />
        <span className="placeholder col-11" style={{ height: 12, borderRadius: 4 }} />
      </div>
      <div className="placeholder tss-skel-arrow" />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const TopSpecialtiesSlider = memo(function TopSpecialtiesSlider({ specialties: propSpecialties, loading: propLoading }) {
  const [fallbackSpecialties, setFallbackSpecialties] = useState([])
  const [fallbackLoading, setFallbackLoading]         = useState(propSpecialties === undefined)
  const [showModal, setShowModal]                     = useState(false)
  const [searchQuery, setSearchQuery]                 = useState('')
  const navigate   = useNavigate()
  const { t, i18n } = useTranslation()
  const language = (typeof window !== 'undefined' && (localStorage.getItem('language') === 'en' || localStorage.getItem('i18nextLng') === 'en')) ? 'en' : 'bn'

  // Fetch only if not provided from parent HomePage
  useEffect(() => {
    if (propSpecialties !== undefined) return
    getSpecialties()
      .then(res => setFallbackSpecialties(res.data?.data || res.data || []))
      .catch(() => setFallbackSpecialties([]))
      .finally(() => setFallbackLoading(false))
  }, [propSpecialties])

  const allSpecialties = propSpecialties !== undefined ? propSpecialties : fallbackSpecialties
  const loading        = propLoading     !== undefined ? propLoading     : fallbackLoading

  // Show 16 specialties to form clean 4x4 rows on desktop like in reference image 2
  const displayed = useMemo(() => allSpecialties.slice(0, 16), [allSpecialties])

  const filteredSpecialties = useMemo(() => {
    if (!searchQuery) return allSpecialties
    const lowerQ = searchQuery.toLowerCase()
    return allSpecialties.filter(s => {
      const bnName = (s.name_bn || translateMetadata(s.name, 'bn', t) || '').toLowerCase()
      const enName = (s.name || '').toLowerCase()
      return bnName.includes(lowerQ) || enName.includes(lowerQ)
    })
  }, [allSpecialties, searchQuery, t])

  if (!loading && allSpecialties.length === 0) return null

  return (
    <section
      id="tss-section"
      className="d-none d-md-block"
      style={{
        padding: '28px 0 32px',
        background: '#FFFFFF',
        position: 'relative'
      }}
    >
      <Container>
        {/* ── Section Header (Exact Reference 2 Layout) ── */}
        <div style={{ marginBottom: '28px' }}>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2
              style={{
                fontSize: 'clamp(22px, 3.2vw, 32px)',
                fontWeight: 900,
                color: '#0F172A',
                margin: 0,
                fontFamily: "'Hind Siliguri', 'Inter', sans-serif",
                letterSpacing: '-0.3px',
                lineHeight: 1.3
              }}
            >
              {language === 'bn' ? (
                <>
                  বিশেষজ্ঞ <span style={{ color: '#059669' }}>চিকিৎসা সেবাসমূহ</span>
                </>
              ) : (
                'Specialist Healthcare Services'
              )}
            </h2>
          </div>
          <p
            style={{
              fontSize: 'clamp(13.5px, 1.6vw, 15px)',
              fontWeight: 500,
              color: '#64748B',
              margin: '4px 0 0 0',
              fontFamily: "'Hind Siliguri', sans-serif"
            }}
          >
            {language === 'bn'
              ? 'আপনার প্রয়োজন অনুযায়ী অভিজ্ঞ বিশেষজ্ঞ ডাক্তার বেছে নিন'
              : 'Find specialist doctors tailored to your medical needs'}
          </p>
        </div>

        {/* ── 4-Column Grid (Image 2 Style) ── */}
        <div>
          {loading ? (
            <Row className="row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-4 g-3">
              {[...Array(16)].map((_, i) => (
                <Col key={i}>
                  <SkeletonCard />
                </Col>
              ))}
            </Row>
          ) : (
            <Row className="row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-4 g-3">
              {displayed.map(spec => (
                <Col key={spec.id}>
                  <SpecCard spec={spec} language={language} t={t} navigate={navigate} />
                </Col>
              ))}
            </Row>
          )}
        </div>

        {/* ── Bottom Action Button ("আরও বিশেষজ্ঞ দেখুন") ── */}
        {allSpecialties.length > 0 && (
          <div className="mt-4 pt-1">
            <div
              onClick={() => setShowModal(true)}
              className="tss-show-more-banner"
              role="button"
              tabIndex={0}
            >
              <div className="tss-show-more-plus">
                <IconPlus size={18} stroke={3} color="#FFFFFF" />
              </div>
              <span className="tss-show-more-text">
                {language === 'bn' ? 'আরও বিশেষজ্ঞ দেখুন' : 'Explore All Specialists'}
              </span>
              <IconChevronRight size={20} stroke={2.5} className="tss-show-more-chevron" />
            </div>
          </div>
        )}
      </Container>

      {/* ── All Specialties Searchable Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered scrollable>
        <Modal.Header style={{ borderBottom: '1px solid #E2E8F0', padding: '20px 28px', background: '#FFFFFF' }}>
          <div>
            <Modal.Title style={{ fontWeight: 800, fontSize: 21, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
              {language === 'bn' ? 'সকল বিশেষজ্ঞ সেবাসমূহ' : 'All Specialist Healthcare Services'}
              <span style={{ fontSize: 14, color: '#059669', marginLeft: 10, fontWeight: 700, background: '#E8F8F2', padding: '3px 10px', borderRadius: 20 }}>
                {allSpecialties.length} টি বিভাগ
              </span>
            </Modal.Title>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#64748B', fontFamily: "'Hind Siliguri', sans-serif" }}>
              {language === 'bn' ? 'যেকোনো বিভাগ নির্বাচন করে সরাসরি ডাক্তারের তালিকা দেখুন' : 'Select any department to view matching specialist doctors'}
            </p>
          </div>
          <button
            onClick={() => setShowModal(false)}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
          >
            <IconX size={26} />
          </button>
        </Modal.Header>

        <Modal.Body style={{ padding: 0, background: '#F8FAFC' }}>
          {/* Sticky Search Field */}
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F8FAFC', padding: '20px 28px 14px 28px', borderBottom: '1px solid rgba(226,232,240,0.6)' }}>
            <InputGroup style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.04)', borderRadius: 14, overflow: 'hidden' }}>
              <InputGroup.Text style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRight: 'none', paddingLeft: 18 }}>
                <IconSearch size={20} color="#059669" />
              </InputGroup.Text>
              <Form.Control
                placeholder={language === 'bn' ? 'বিভাগের নাম লিখে খুঁজুন (যেমন: মেডিসিন, হৃদরোগ, কিডনি)...' : 'Search specialties by name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: '1px solid #E2E8F0', borderLeft: 'none', boxShadow: 'none', padding: '13px 16px', fontSize: 15, fontFamily: "'Hind Siliguri', sans-serif" }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: 'none', padding: '0 16px', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <IconX size={18} />
                </button>
              )}
            </InputGroup>
          </div>

          {/* Modal Grid */}
          <div style={{ padding: '20px 28px 36px 28px' }}>
            <Row className="row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-3 g-3">
              {filteredSpecialties.length > 0 ? (
                filteredSpecialties.map(spec => (
                  <Col key={spec.id}>
                    <div onClick={() => setShowModal(false)} style={{ height: '100%' }}>
                      <SpecCard spec={spec} language={language} t={t} navigate={navigate} />
                    </div>
                  </Col>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748B', width: '100%' }}>
                  <IconSearch size={40} color="#CBD5E1" style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                    {language === 'bn' ? 'কোনো বিভাগ পাওয়া যায়নি' : 'No specialties found'}
                  </p>
                </div>
              )}
            </Row>
          </div>
        </Modal.Body>
      </Modal>

      {/* ── Scoped Styling (Exact Match to Reference Image 2) ── */}
      <style>{`
        /* Card Container */
        .tss-spec-card {
          background: #FFFFFF;
          border: 1.2px solid #EDF2F7;
          border-radius: 18px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
          user-select: none;
          height: 100%;
          min-height: 82px;
          position: relative;
          overflow: hidden;
        }

        .tss-spec-card:hover {
          transform: translateY(-3px);
          border-color: var(--card-border, #CBD5E1);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.07);
        }

        /* Left Circular Icon Badge */
        .tss-spec-icon-badge {
          width: 50px;
          height: 50px;
          min-width: 50px;
          border-radius: 50%;
          background: var(--card-bg, #F1F5F9);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.25s ease;
        }

        .tss-spec-card:hover .tss-spec-icon-badge {
          transform: scale(1.06);
        }

        /* Middle Content Info */
        .tss-spec-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 3px;
        }

        .tss-spec-title {
          font-size: 15.5px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          line-height: 1.3;
          font-family: 'Hind Siliguri', 'Inter', sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.2s ease;
        }

        .tss-spec-card:hover .tss-spec-title {
          color: var(--card-accent, #0F172A);
        }

        .tss-spec-desc {
          font-size: 12px;
          font-weight: 500;
          color: #64748B;
          margin: 0;
          line-height: 1.35;
          font-family: 'Hind Siliguri', 'Inter', sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Right Chevron Badge */
        .tss-spec-arrow {
          width: 32px;
          height: 32px;
          min-width: 32px;
          border-radius: 50%;
          background: var(--card-bg, #F8FAFC);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
        }

        .tss-spec-card:hover .tss-spec-arrow {
          transform: translateX(3px);
          background: var(--card-accent);
        }

        .tss-spec-card:hover .tss-spec-arrow svg {
          color: #FFFFFF !important;
          stroke: #FFFFFF !important;
        }

        /* Bottom "Show More" Banner Button */
        .tss-show-more-banner {
          background: #EDFDF8;
          border: 1.5px dashed #A7F3D0;
          border-radius: 16px;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.25s ease;
          user-select: none;
        }

        .tss-show-more-banner:hover {
          background: #E0F7F0;
          border-color: #059669;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(5, 150, 105, 0.12);
        }

        .tss-show-more-plus {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #047857;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.25s ease;
        }

        .tss-show-more-banner:hover .tss-show-more-plus {
          transform: rotate(90deg);
        }

        .tss-show-more-text {
          font-size: 16px;
          font-weight: 800;
          color: #065F46;
          font-family: 'Hind Siliguri', 'Inter', sans-serif;
          letter-spacing: -0.2px;
        }

        .tss-show-more-chevron {
          color: #065F46;
          transition: transform 0.25s ease;
        }

        .tss-show-more-banner:hover .tss-show-more-chevron {
          transform: translateX(4px);
        }

        /* Skeleton Card Loading State */
        .tss-spec-skeleton {
          background: #FFFFFF;
          border: 1.2px solid #EDF2F7;
          border-radius: 18px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 82px;
        }

        .tss-skel-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
        }

        .tss-skel-arrow {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }
      `}</style>
    </section>
  )
})

export default TopSpecialtiesSlider

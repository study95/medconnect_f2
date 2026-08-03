import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  IconChevronLeft, IconShieldCheck, IconClock, IconStar, 
  IconUsers, IconArrowRight, IconDiscount2, IconBuildingHospital,
  IconStethoscope, IconHeart, IconCircleCheck
} from '@tabler/icons-react'
import axiosInstance from '../api/axiosInstance'

const CATS = [
  { key: 'all', label: 'সকল সেবা', icon: '🏥' },
  { key: 'diagnostic', label: 'ডায়াগনস্টিক', icon: '🔬' },
  { key: 'clinical', label: 'চিকিৎসা সেবা', icon: '🩺' },
  { key: 'surgical', label: 'সার্জারি সেবা', icon: '⚕️' },
  { key: 'check', label: 'হেলথ চেকআপ', icon: '❤️' },
  { key: 'mother', label: 'মা ও শিশু সেবা', icon: '👶' },
  { key: 'dental', label: 'ডেন্টাল সেবা', icon: '🦷' },
  { key: 'eye', label: 'চোখের সেবা', icon: '👁️' },
  { key: 'mental', label: 'মানসিক স্বাস্থ্য', icon: '🧠' },
  { key: 'physio', label: 'ফিজিওথেরাপি', icon: '🏃' },
]

const DEFAULT_SERVICES = [
  { id: 1, title_bn: 'ডায়াগনস্টিক সেবা', description_bn: 'প্রত্যয়িত কেন্দ্র থেকে উন্নত ল্যাবরেটরি এবং ইমেজিং ডায়াগনস্টিক।', icon: 'diagnostic', category: 'Diagnostic', count: '১২০০+', count_label: 'ডায়াগনস্টিক কেন্দ্র', items_bn: ['রক্ত পরীক্ষা', 'এক্স-রে ও সিটি স্ক্যান', 'আলট্রাসাউন্ড', 'ইসিজি'] },
  { id: 2, title_bn: 'ক্লিনিক্যাল সেবা', description_bn: 'সকল চিকিৎসা ক্ষেত্রে বিশেষজ্ঞ ডাক্তারদের কাছ থেকে পরামর্শ।', icon: 'clinical', category: 'Clinical', count: '৮৫০+', count_label: 'বিশেষজ্ঞ ডাক্তার', items_bn: ['হৃদরোগ', 'স্নায়ুবিদ্যা', 'অর্থোপেডিক্স', 'গ্যাস্ট্রোএন্টেরোলজি'] },
  { id: 3, title_bn: 'সার্জিক্যাল সেবা', description_bn: 'মানসম্মত হাসপাতালে প্রত্যয়িত সার্জনদের দ্বারা আধুনিক অস্ত্রোপচার।', icon: 'surgical', category: 'Surgical', count: '৩০০+', count_label: 'হাসপাতাল', items_bn: ['ল্যাপারোস্কোপিক', 'অর্থোপেডিক সার্জারি', 'কার্ডিয়াক সার্জারি', 'সাধারণ সার্জারি'] },
  { id: 4, title_bn: 'হেলথ চেকআপ', description_bn: 'নিয়মিত পর্যবেক্ষণ ও প্রতিরোধের জন্য ব্যাপক স্বাস্থ্য প্যাকেজ।', icon: 'check', category: 'Health Check', count: '৮০০+', count_label: 'চেকআপ প্যাকেজ', items_bn: ['বেসিক চেকআপ', 'প্রিমিয়াম চেকআপ', 'কর্পোরেট স্বাস্থ্য', 'প্রাক-বিবাহ পরীক্ষা'] },
  { id: 5, title_bn: 'মা ও শিশু সেবা', description_bn: 'গর্ভাবস্থায় মায়েদের জন্য বিশেষayit যত্ন ও শিশু স্বাস্থ্য সেবা।', icon: 'mother', category: 'Mother & Child', count: '৬০০+', count_label: 'ক্লিনিক', items_bn: ['প্রসবপূর্ব যত্ন', 'শিশু চিকিৎসা', 'নবজাতক সেবা', 'পুষ্টি পরামর্শ'] },
  { id: 6, title_bn: 'ডেন্টাল সেবা', description_bn: 'যোগ্য ক্লিনিকে প্রত্যয়িত দন্ত চিকিৎসকদের কাছ থেকে আধুনিক দাঁতের যত্ন।', icon: 'dental', category: 'Dental', count: '৪০০+', count_label: 'ডেন্টাল ক্লিনিক', items_bn: ['দাঁত পরিষ্কার', 'রুট ক্যানাল', 'দাঁত সাদা করা', 'ডেন্টাল ইমপ্লান্ট'] },
  { id: 7, title_bn: 'চোখের সেবা', description_bn: 'আধুনিক যন্ত্রপাতির সাহায্যে চোখের পরীক্ষা, চশমা নির্ধারণ এবং ছানি অপারেশনসহ উন্নত সেবা।', icon: 'eye', category: 'Eye Care', count: '২৫০+', count_label: 'চক্ষু কেন্দ্র', items_bn: ['চোখের পরীক্ষা', 'ছানি অপারেশন', 'কনট্যাক্ট লেন্স', 'চশমা নির্ধারণ'] },
  { id: 8, title_bn: 'মানসিক স্বাস্থ্য', description_bn: 'মানসিক চাপ, বিষণ্ণতা, উদ্বেগ ও অন্যান্য মানসিক সমস্যার জন্য বিশেষজ্ঞ থেরাপিস্টদের কাউন্সিলিং।', icon: 'mental', category: 'Mental Health', count: '১৫০+', count_label: 'থেরাপিস্ট ও কাউন্সিলর', items_bn: ['কাউন্সিলিং ও থেরাপি', 'বিষণ্ণতা নিরাময়', 'পারিবারিক থেরাপি', 'উদ্বেগ নিয়ন্ত্রণ'] },
  { id: 9, title_bn: 'ফিজিওথেরাপি', description_bn: 'হাড়ের ব্যথা, প্যারালাইসিস, স্ট্রোক ও স্পোর্টস ইনজুরির জন্য দক্ষ থেরাপিস্টদের দ্বারা আধুনিক থেরাপি সেবা।', icon: 'physio', category: 'Physiotherapy', count: '৫০০+', count_label: 'থেরাপি সেন্টার', items_bn: ['পেইন ম্যানেজমেন্ট', 'স্ট্রোক পুনর্বাসন', 'স্পোর্টস ইনজুরি থেরাপি', 'পক্ষাঘাতগ্রস্ত পুনর্বাসন'] },
]

const ICON_MAP = { 
  diagnostic: '🔬', 
  clinical: '🩺', 
  surgical: '⚕️', 
  check: '❤️', 
  mother: '👶', 
  dental: '🦷',
  eye: '👁️',
  mental: '🧠',
  physio: '🏃'
}

const CARD_THEMES = {
  diagnostic: { primary: '#00A88C', secondary: '#F0FDF4', text: '#065F46', border: 'rgba(0, 168, 140, 0.12)', glow: 'rgba(0, 168, 140, 0.15)' },
  clinical: { primary: '#0EA5E9', secondary: '#F0F9FF', text: '#0369A1', border: 'rgba(14, 165, 233, 0.12)', glow: 'rgba(14, 165, 233, 0.15)' },
  surgical: { primary: '#6366F1', secondary: '#EEF2FF', text: '#3730A3', border: 'rgba(99, 102, 241, 0.12)', glow: 'rgba(99, 102, 241, 0.15)' },
  check: { primary: '#F43F5E', secondary: '#FFF1F2', text: '#9F1239', border: 'rgba(244, 63, 94, 0.12)', glow: 'rgba(244, 63, 94, 0.15)' },
  mother: { primary: '#F59E0B', secondary: '#FEF3C7', text: '#92400E', border: 'rgba(245, 158, 11, 0.12)', glow: 'rgba(245, 158, 11, 0.15)' },
  dental: { primary: '#14B8A6', secondary: '#F0FDFA', text: '#0F766E', border: 'rgba(20, 184, 166, 0.12)', glow: 'rgba(20, 184, 166, 0.15)' },
  eye: { primary: '#8B5CF6', secondary: '#F5F3FF', text: '#5B21B6', border: 'rgba(139, 92, 246, 0.12)', glow: 'rgba(139, 92, 246, 0.15)' },
  mental: { primary: '#EC4899', secondary: '#FDF2F8', text: '#9D174D', border: 'rgba(236, 72, 153, 0.12)', glow: 'rgba(236, 72, 153, 0.15)' },
  physio: { primary: '#22C55E', secondary: '#F0FDF4', text: '#166534', border: 'rgba(34, 197, 94, 0.12)', glow: 'rgba(34, 197, 94, 0.15)' },
}

const DEFAULT_THEME = { primary: '#00A88C', secondary: '#F0FDF4', text: '#065F46', border: 'rgba(0, 168, 140, 0.12)', glow: 'rgba(0, 168, 140, 0.15)' }

const SERVICE_DETAILS = {
  1: {
    detailed_desc_bn: 'আমাদের ডায়াগনস্টিক সেবা অত্যন্ত বিশ্বস্ত এবং নির্ভরযোগ্য। আন্তর্জাতিক মানের ল্যাবরেটরি ও ইমেজিং প্রযুক্তির সাহায্যে আমরা নিখুঁত ফলাফল নিশ্চিত করি। রোগ নির্ণয়ের সঠিকতা ও দ্রুত ডেলিভারির কারণে দেশজুড়ে আমাদের নেটওয়ার্ক বিস্তৃত।',
    extended_items: [
      { title: 'রক্ত ও মলমূত্র পরীক্ষা', desc: 'কমপ্লিট ব্লাড কাউন্ট (CBC), থাইরয়েড প্রোফাইল, লিভার ও কিডনি ফাংশন টেস্ট।' },
      { title: 'এক্স-রে ও সিটি স্ক্যান', desc: 'উচ্চ রেজোলিউশন ডিজিটাল এক্স-রে এবং ১২৮ স্লাইস আল্ট্রা-ফাস্ট সিটি স্ক্যান।' },
      { title: 'আলট্রাসাউন্ড', desc: '4D কালার ডপলার আলট্রাসনোগ্রাফি বিশেষজ্ঞ সনোলজিস্ট দ্বারা সম্পন্ন।' },
      { title: 'ইসিজি ও ইকোকার্ডিওগ্রাফি', desc: 'হৃদরোগের প্রাথমিক ও উন্নত পরীক্ষার জন্য উন্নত কার্ডিয়াক ডায়াগনস্টিকস।' }
    ],
    features: ['১০০% সঠিক রিপোর্টের নিশ্চয়তা', 'অনলাইন রিপোর্ট ডাউনলোড সুবিধা', 'সার্টিফাইড প্যাথলজিস্ট প্যানেল', 'দ্রুততম সময়ে ইমেইল ডেলিভারি'],
    stats: { centers: '১২০০+', doctors: '৪০০+', satisfaction: '৯৮%', discount: '১৫%' }
  },
  2: {
    detailed_desc_bn: 'মেডকানেক্টের ক্লিনিক্যাল সেবা নেটওয়ার্কের মাধ্যমে দেশের সেরা বিশেষজ্ঞ ডাক্তারদের পরামর্শ এখন আপনার হাতের মুঠোয়। যেকোনো সাধারণ রোগ বা জটিল দীর্ঘমেয়াদী শারীরিক সমস্যার জন্য সরাসরি চেম্বারে অথবা ভিডিও কলে প্রফেশনাল ওয়ান-অন-অন চিকিৎসা সেবা প্রদান করা হয়।',
    extended_items: [
      { title: 'হৃদরোগ ও কার্ডিওলজি', desc: 'বুকে ব্যথা, উচ্চ রক্তচাপ ও অন্যান্য হৃদযন্ত্রের জটিলতায় বিশেষজ্ঞ কনসালটেশন।' },
      { title: 'নিউরোলজি ও স্নায়ুবিদ্যা', desc: 'মাথাব্যথা, স্ট্রোক, মৃগীরোগ ও স্নায়বিক দুর্বলতার আধুনিক পর্যবেক্ষণ।' },
      { title: 'অর্থোপেডিক ও হাড়জোড়', desc: 'হাড়ের ক্ষয়রোগ, বাতব্যথা ও জয়েন্ট ব্যথার স্থায়ী ক্লিনিক্যাল সমাধান।' },
      { title: 'গ্যাস্ট্রোএন্টেরোলজি', desc: 'অ্যাসিডিটি, বুক জ্বালাপোড়া, আলসার ও পেটের যাবতীয় সমস্যার সুচিকিৎসা।' }
    ],
    features: ['দক্ষিণ এশিয়ার ডিগ্রিধারী ডাক্তার', 'সহজ প্রেসক্রিপশন ট্র্যাকিং সুবিধা', 'পরবর্তী ফলো-আপে বিশেষ ছাড়', 'জরুরি অ্যাপয়েন্টমেন্ট সাপোর্ট'],
    stats: { centers: '৮৫০+', doctors: '১৫০০+', satisfaction: '৯৭%', discount: '১০%' }
  },
  3: {
    detailed_desc_bn: 'আমাদের সার্জিক্যাল সেবায় যুক্ত রয়েছে দেশের স্বনামধন্য ও আন্তর্জাতিকভাবে প্রশংসিত সার্জনদের টিম। স্টেট-অফ-দ্য-আর্ট অপারেশন থিয়েটার সমৃদ্ধ বিশ্বস্ত হাসপাতালগুলোতে আধুনিক মিনিমালি ইনভেসিভ টেকনোলজির সাহায্যে নিরাপদ ও নিখুঁত অস্ত্রোপচার সম্পন্ন করা হয়।',
    extended_items: [
      { title: 'ল্যাপারোস্কোপিক সার্জারি', desc: 'কম কাটাছেঁড়া ও দ্রুত আরোগ্যের জন্য আধুনিক দূরবীক্ষণ যন্ত্রের সাহায্যে অপারেশন।' },
      { title: 'অর্থোপেডিক ও জয়েন্ট প্রতিস্থাপন', desc: 'হিপ বা হাঁটু প্রতিস্থাপন ও ফ্র্যাকচার পরবর্তী সফল রিকনস্ট্রাকশন সার্জারি।' },
      { title: 'কার্ডিয়াক ওপেন হার্ট', desc: 'বাইপাস সার্জারি ও হার্টের ভালভ প্রতিস্থাপনে দেশের শীর্ষ সার্জনদের উপস্থিতি।' },
      { title: 'সাধারণ ও কলোরেক্টাল সার্জারি', desc: 'হার্নিয়া, অ্যাপেন্ডিক্স, পিত্তথলির পাথর ও পাইলসের আধুনিকতম অস্ত্রোপচার।' }
    ],
    features: ['অভিজ্ঞ সার্জনদের সমন্বয়', 'উন্নত আইসিইউ (ICU) ব্যাকআপ', 'নিয়মিত সার্জারি পরবর্তী ফলো-আপ', 'সহজ কিস্তি সুবিধা (EMI)'],
    stats: { centers: '৩০০+', doctors: '২৫০+', satisfaction: '৯৯%', discount: '২০%' }
  },
  4: {
    detailed_desc_bn: 'প্রতিকারের চেয়ে প্রতিরোধই উত্তম। আমাদের তৈরি বিশেষ স্বাস্থ্য পরীক্ষা (Health Checkup) প্যাকেজগুলো আপনাকে নীরবে শরীরে বাসা বাঁধা রোগগুলো শনাক্ত করতে সহায়তা করবে। আপনার বয়স ও জীবনযাত্রার সাথে মানানসই প্যাকেজ বেছে নিন এখনই।',
    extended_items: [
      { title: 'বেসিক হেলথ চেকআপ', desc: 'প্রাথমিক পরীক্ষা যার মধ্যে ব্লাড সুগার, ক্রিয়েটিনিন, ইউরিক অ্যাসিড ও ইসিজি অন্তর্ভুক্ত।' },
      { title: 'প্রিমিয়াম ফুল বডি চেকআপ', desc: 'ডিগ্রী ও ৩০+ প্যারামিটার পরীক্ষা, থাইরয়েড ও আলট্রাসনোগ্রাফিসহ সম্পূর্ণ স্ক্রিনিং।' },
      { title: 'কর্পোরেট স্বাস্থ্য প্যাকেজ', desc: 'চাকুরিজীবী ও প্রতিষ্ঠানের কর্মকর্তা-কর্মচারীদের কাজের স্পৃহা বৃদ্ধিতে বিশেষ প্যাকেজ।' },
      { title: 'প্রাক-বিবাহ স্বাস্থ্য পরীক্ষা', desc: 'ভবিষ্যৎ প্রজন্মের নিরাপত্তা ও দাম্পত্য সুখ নিশ্চিতে থ্যালাসেমিয়াসহ প্রাক-বিবাহ স্ক্রিনিং।' }
    ],
    features: ['অভিজ্ঞ কনসালট্যান্টের সাথে ফ্রি কাউন্সিলিং', 'সম্পূর্ণ ফ্যামিলি প্যাকেজে আকর্ষণীয় ডিসকাউন্ট', 'সুবিধাজনক হোম স্যাম্পল কালেকশন', 'ডিটেইলড হেলথ রিপোর্ট বুকলেট'],
    stats: { centers: '৮০০+', doctors: '৩৫০+', satisfaction: '৯৬%', discount: '২৫%' }
  },
  5: {
    detailed_desc_bn: 'মা ও শিশুর সুস্থতা আমাদের সর্বোচ্চ অগ্রাধিকার। গর্ভাবস্থায় মায়েদের বিশেষ যত্ন, প্রসবপূর্ব ও প্রসবোত্তর পরামর্শ এবং শিশুদের সার্বিক শারীরিক ও মানসিক বিকাশে আমরা আধুনিক ও সংবেদনশীল চিকিৎসা সেবা প্রদান করতে প্রতিশ্রুতিবদ্ধ।',
    extended_items: [
      { title: 'প্রসবপূর্ব যত্ন ও গাইনোকোলজি', desc: 'গর্ভকালীন জটিলতা এড়াতে নিয়মিত চেকআপ ও সুষম খাদ্যতালিকা নির্ধারণ।' },
      { title: 'নবজাতক ও শিশু চিকিৎসা', desc: 'টিকা দান কর্মসূচী, শিশুর দৈহিক বৃদ্ধি পর্যবেক্ষণ ও শিশু বিশেষজ্ঞ টিম।' },
      { title: 'পেডিয়াট্রিক কনসালটেশন', desc: 'শিশুর সর্দি-কাশি, কৃমি, অপুষ্টি ও আচরণগত সমস্যার আধুনিক কাউন্সিলিং।' },
      { title: 'মায়েদের মানসিক স্বাস্থ্য', desc: 'প্রসব-পরবর্তী বিষণ্ণতা (Postpartum Depression) কাটিয়ে ওঠার থেরাপি।' }
    ],
    features: ['মহিলা ডাক্তারদের দ্বারা সেবার নিশ্চয়তা', '২৪ ঘণ্টা ইমার্জেন্সি ডেলিভারি সাপোর্ট', 'শিশুদের ফ্রেন্ডলি পরিবেশ ও ভ্যাকসিনেশন', 'প্যারেন্টিং গাইড বুকলেট ফ্রি'],
    stats: { centers: '৬০০+', doctors: '৪০০+', satisfaction: '环境', discount: '১২%' }
  },
  6: {
    detailed_desc_bn: 'আপনার সুন্দর হাসির সুরক্ষায় মেডকানেক্টের ডেন্টাল কেয়ার। অত্যাধুনিক প্রযুক্তি ও জীবাণুমুক্ত পরিবেশের সাহায্যে দাঁতের যেকোনো জটিলতা নিরাময় এবং উজ্জ্বল ঝকঝকে হাসির নিশ্চয়তায় কাজ করেন আমাদের রেজিস্টার্ড দন্ত চিকিৎসকরা।',
    extended_items: [
      { title: 'দাঁত পরিষ্কার ও স্কেলিং', desc: 'দাঁতের ক্ষতিকর প্লাক ও পাথর অপসারণ করে মাড়ি সুস্থ রাখার আধুনিক পদ্ধতি।' },
      { title: 'রুট ক্যানাল থেরাপি', desc: 'ব্যথামুক্ত পদ্ধতিতে দাঁত না ফেলে দীর্ঘস্থায়ীভাবে শিকড় চিকিৎসার আধুনিক সমাধান।' },
      { title: 'কসমেটিক ডেন্টিস্ট্রি', desc: 'দাঁত সাদা করা, বাঁকা দাঁত সোজা করা এবং স্মাইল ডিজাইন লেজার চিকিৎসা।' },
      { title: 'ডেন্টাল ইমপ্লান্ট', desc: 'স্থায়ী কৃত্রিম দাঁত স্থাপনের জন্য নির্ভরযোগ্য ও দীর্ঘস্থায়ী ইমপ্লান্ট পদ্ধতি।' }
    ],
    features: ['১০০% জীবাণুমুক্ত বা স্টেরিলাইজড যন্ত্রপাতি', 'ব্যথামুক্ত ডেন্টাল থেরাপির সুবিধা', 'আমদানিকৃত আধুনিক ডেন্টাল মেটেরিয়ালস', 'শিশুদের জন্য বিশেষ ব্যথহীন ডেন্টাল কেয়ার'],
    stats: { centers: '৪০০+', doctors: '৩০০+', satisfaction: '৯৭%', discount: '১৫%' }
  },
  7: {
    detailed_desc_bn: 'দৃষ্টিশক্তি মানুষের এক অমূল্য সম্পদ। চোখের যাবতীয় রোগ যেমন: ছানি, গ্লুকোমা, প্রতিসরণ ত্রুটি ইত্যাদির চিকিৎসায় আমাদের রয়েছে অভিজ্ঞ চক্ষু বিশেষজ্ঞদের দল এবং আধুনিক ডায়াগনস্টিক যন্ত্রপাতি। নিখুঁত পরীক্ষার মাধ্যমে চশমার সঠিক পাওয়ার নির্ধারণ করা হয়।',
    extended_items: [
      { title: 'চোখের বিস্তারিত পরীক্ষা', desc: 'দৃষ্টিশক্তি পরিমাপ, প্রেশার পরীক্ষা ও রেটিনা স্ক্রিনিংয়ের অত্যাধুনিক পদ্ধতি।' },
      { title: 'ছানি ও মাইক্রো-সার্জারি', desc: 'ফ্যাকো (Phaco) প্রযুক্তির সাহায্যে অতি অল্প সময়ে ব্যথামুক্ত ছানি অপারেশন।' },
      { title: 'চশমা ও কন্টাক্ট লেন্স', desc: 'ডিজিটাল কম্পিউটারাইজড পদ্ধতিতে পাওয়ার টেস্ট এবং উন্নত লেন্স সিলেকশন।' },
      { title: 'শিশুদের চক্ষু যত্ন', desc: 'শিশুদের টেরা চোখ, মাইনাস পাওয়ারের চিকিৎসায় বিশেষ পেডিয়াট্রিক অফথালমোলজি।' }
    ],
    features: ['কম্পিউটারাইজড অটো-রিফ্র্যাকশন পদ্ধতি', 'ফ্যাকো অপারেশনে বিশেষ কর্পোরেট ডিসকাউন্ট', 'ইনস্ট্যান্ট পাওয়ার নির্ধারণ ও চশমা বিতরণ', 'উন্নত মানের অপটিক্যাল শপ সুবিধা'],
    stats: { centers: '২৫০+', doctors: '২০০+', satisfaction: '৯৮%', discount: '১০%' }
  },
  8: {
    detailed_desc_bn: 'শারীরিক সুস্থতার মতোই মানসিক প্রশান্তি অত্যন্ত জরুরি। বিষণ্ণতা, অতিরিক্ত উদ্বেগ, একাকীত্ব, পারিবারিক কলহ ও পেশাগত জীবনের মানসিক চাপ কাটিয়ে উঠতে আমাদের বিশেষজ্ঞ থেরাপিস্ট ও কাউন্সিলর টিম সম্পূর্ণ প্রাইভেসির সাথে সহমর্মিতার হাত বাড়িয়ে দিচ্ছে।',
    extended_items: [
      { title: 'ব্যক্তিগত কাউন্সিলিং ও থেরাপি', desc: 'উদ্বেগ, বিষণ্ণতা ও মানসিক অস্থিরতা দূরীকরণে ওয়ান-অন-ওয়ান সেশন।' },
      { title: 'পারিবারিক ও দম্পতি থেরাপি', desc: 'দাম্পত্য জটিলতা দূরীকরণ ও সুন্দর পারিবারিক সম্পর্ক গড়ে তোলার গাইডলাইন।' },
      { title: 'পেশাগত কাউন্সিলিং', desc: 'কর্মক্ষেত্রের ক্লান্তি (Burnout) ও ক্যারিয়ার রিলেটেড মানসিক অবসাদ কাটানোর টিপস।' },
      { title: 'শিশুদের আচরণগত থেরাপিউটিক্স', desc: 'অটিজম, এডিএইচডি ও অতিরিক্ত মোবাইল আসক্তি দূর করার প্রফেশনাল থেরাপি।' }
    ],
    features: ['১০০% কঠোর গোপনীয়তার নিশ্চয়তা', 'অনলাইন ও অফলাইন উভয় সেশনের সুবিধা', 'সার্টিফাইড ক্লিনিক্যাল সাইকোলজিস্ট প্যানেল', 'রিলাক্সেশন ও মেডিটেশন গাইডলাইন ফ্রি'],
    stats: { centers: '১৫০+', doctors: '১২০+', satisfaction: '৯৬%', discount: '১৫%' }
  },
  9: {
    detailed_desc_bn: 'হাড়ের ব্যথা, প্যারালাইসিস, স্ট্রোক ও স্পোর্টস ইনজুরির পরে শরীরের স্বাভাবিক কর্মক্ষমতা ফিরিয়ে আনতে ফিজিওথেরাপি অনন্য। আমাদের দক্ষ ও প্রত্যয়িত থেরাপিস্টরা আধুনিক বৈজ্ঞানিক ব্যায়াম ও লেজার যন্ত্রপাতির সাহায্যে দ্রুত আরোগ্য নিশ্চিত করেন।',
    extended_items: [
      { title: 'ব্যথা উপশম ও পেইন ম্যানেজমেন্ট', desc: 'মেরুদণ্ড, কোমর, ঘাড় ও হাঁটু ব্যথার স্থায়ী উপশমে ইলেকট্রোথেরাপি ও ব্যায়াম।' },
      { title: 'স্ট্রোক ও প্যারালাইসিস পুনর্বাসন', desc: 'পক্ষাঘাতগ্রস্ত রোগীদের পেশী শক্তি বাড়িয়ে স্বাবলম্বী করার বিশেষ রিহ্যাবিলিটেশন।' },
      { title: 'স্পোর্টস ইনজুরি থেরাপি', desc: 'খেলোয়াড়দের পেশী ছিঁড়ে যাওয়া, মচকানো ও জয়েন্ট ইনজুরির দ্রুত থেরাপিউটিক চিকিৎসা।' },
      { title: 'পোস্ট-অপারেটিভ থেরাপি', desc: 'যেকোনো বড় অর্থোপেডিক অপারেশনের পরে জয়েন্ট নড়াচড়া স্বাভাবিক করার ব্যায়াম।' }
    ],
    features: ['বাসায় গিয়ে থেরাপি দেওয়ার বিশেষ সুবিধা (Home Visit)', 'আধুনিক আল্ট্রাসাউন্ড ও শর্টওয়েভ ডায়াথার্মি মেশিন', 'অভিজ্ঞ ফিজিওথেরাপিস্টদের সার্বক্ষণিক তত্ত্বাবধান', 'ব্যক্তিগত রিহ্যাবিলিটেশন প্ল্যান ডিজাইন'],
    stats: { centers: '৫০০+', doctors: '২৫০+', satisfaction: '৯৯%', discount: '২০%' }
  }
}

export default function ServiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [hoveredCard, setHoveredCard] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  // TanStack Query — cached 10min, services rarely change
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get('/services')
        return res.data && res.data.length > 0 ? res.data : DEFAULT_SERVICES
      } catch (err) {
        return DEFAULT_SERVICES
      }
    },
    staleTime: 10 * 60 * 1000,
    placeholderData: DEFAULT_SERVICES,
  })

  // Find the selected service
  const service = services.find(s => String(s.id) === String(id)) || DEFAULT_SERVICES[0]
  const details = SERVICE_DETAILS[service.id] || SERVICE_DETAILS[1]
  const icon = ICON_MAP[service.icon] || '🏥'
  const theme = CARD_THEMES[service.icon] || DEFAULT_THEME

  // Get similar services (excluding current one)
  const similarServices = services
    .filter(s => String(s.id) !== String(service.id))
    .slice(0, 3)

  return (
    <div style={{ background: '#F8FAFC', fontFamily: "'Hind Siliguri', sans-serif", paddingBottom: 100, paddingTop: 100 }}>
      {/* Dynamic Immersive Hero Section */}
      <section style={{ 
        background: `linear-gradient(135deg, ${theme.secondary} 0%, #FFFFFF 100%)`, 
        padding: '50px 0 60px', 
        position: 'relative', 
        overflow: 'hidden',
        borderBottom: '1px solid #E2E8F0'
      }}>
        {/* Glowing backdrop circular ring */}
        <div style={{ 
          position: 'absolute', 
          top: -100, 
          right: -100, 
          width: 400, 
          height: 400, 
          background: `radial-gradient(circle, ${theme.primary}12 0%, transparent 70%)`, 
          pointerEvents: 'none' 
        }} />
        
        <Container>
          {/* Elegant Breadcrumb Back Link */}
          <button 
            onClick={() => navigate('/services')}
            style={{
              background: 'white',
              border: '1.5px solid #E2E8F0',
              borderRadius: 12,
              padding: '10px 18px',
              color: '#475569',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              marginBottom: 32,
              boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = theme.primary;
              e.currentTarget.style.color = theme.primary;
              e.currentTarget.style.boxShadow = `0 6px 16px ${theme.glow}`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.color = '#475569';
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.02)';
            }}
          >
            <IconChevronLeft size={16} stroke={3} /> সেবাসমূহে ফিরে যান
          </button>

          <Row className="align-items-center">
            <Col lg={7}>
              {/* Floating dynamic role badge */}
              <span style={{ 
                background: theme.secondary, 
                color: theme.text, 
                fontSize: 13.5, 
                fontWeight: 800, 
                padding: '8px 18px', 
                borderRadius: 99, 
                display: 'inline-flex', 
                alignItems: 'center',
                gap: 8,
                marginBottom: 24,
                border: `1.5px solid ${theme.primary}1A`
              }}>
                <span style={{ fontSize: 16 }}>{icon}</span> 
                {service.category || 'Doctor Booklet Service'}
              </span>

              {/* Title */}
              <h1 style={{ 
                fontSize: 'clamp(32px, 5vw, 46px)', 
                fontWeight: 900, 
                color: '#0F172A', 
                lineHeight: 1.2, 
                marginBottom: 20 
              }}>
                {service.title_bn || service.name}
              </h1>

              {/* Tagline */}
              <p style={{ 
                fontSize: 17.5, 
                color: '#475569', 
                lineHeight: 1.75, 
                marginBottom: 0,
                maxWidth: 620
              }}>
                {service.description_bn || service.description_en}
              </p>
            </Col>

            {/* Quick Hero Statistics cards */}
            <Col lg={5} className="mt-5 mt-lg-0">
              <div style={{
                background: 'white',
                border: '1.5px solid #F1F5F9',
                borderRadius: 28,
                padding: 32,
                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.04)',
                position: 'relative'
              }}>
                {/* Glowing top line */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 6,
                  borderRadius: '28px 28px 0 0',
                  background: `linear-gradient(90deg, ${theme.primary} 0%, ${theme.primary}90 100%)`
                }} />

                <h5 style={{ fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>সেবা সম্পর্কিত সংক্ষিপ্ত তথ্য</h5>
                
                <Row className="g-4">
                  <Col xs={6}>
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ color: '#94A3B8', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>নেটওয়ার্ক কভারেজ</div>
                      <div style={{ color: theme.primary, fontSize: 24, fontWeight: 900 }}>{service.count || details.stats.centers}</div>
                      <div style={{ color: '#475569', fontSize: 12, fontWeight: 650 }}>{service.count_label || 'নিবন্ধিত কেন্দ্র'}</div>
                    </div>
                  </Col>

                  <Col xs={6}>
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ color: '#94A3B8', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>বিশেষজ্ঞ টিম</div>
                      <div style={{ color: '#0F172A', fontSize: 24, fontWeight: 900 }}>{details.stats.doctors}</div>
                      <div style={{ color: '#475569', fontSize: 12, fontWeight: 650 }}>অন-কল ডাক্তার</div>
                    </div>
                  </Col>

                  <Col xs={6}>
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ color: '#94A3B8', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>রোগী সন্তুষ্টি</div>
                      <div style={{ color: '#0F172A', fontSize: 24, fontWeight: 900 }}>{details.stats.satisfaction}</div>
                      <div style={{ color: '#475569', fontSize: 12, fontWeight: 650 }}>পজিটিভ রিভিউ</div>
                    </div>
                  </Col>

                  <Col xs={6}>
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ color: '#94A3B8', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>বিশেষ অফার</div>
                      <div style={{ color: '#EF4444', fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconDiscount2 size={24} /> {details.stats.discount}
                      </div>
                      <div style={{ color: '#475569', fontSize: 12, fontWeight: 650 }}>সকল বুকিংয়ে ছাড়</div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Main Content Layout Section */}
      <Container className="mt-5">
        <Row className="g-5">
          {/* Main detailed descriptions */}
          <Col lg={8}>
            <Card style={{ 
              border: '1.5px solid #F1F5F9', 
              borderRadius: 24, 
              padding: '40px 36px', 
              boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
              background: 'white',
              marginBottom: 40
            }}>
              <h3 style={{ fontWeight: 900, color: '#0F172A', marginBottom: 20 }}>সেবার বিস্তারিত বিবরণ</h3>
              <p style={{ fontSize: 16.5, color: '#334155', lineHeight: 1.85, marginBottom: 36 }}>
                {details.detailed_desc_bn}
              </p>

              <h4 style={{ fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>আমাদের প্রধান সেবা ক্ষেত্রসমূহ</h4>
              <Row className="g-4 mb-4">
                {details.extended_items.map((item, idx) => (
                  <Col md={6} key={idx}>
                    <div style={{ 
                      padding: 24, 
                      borderRadius: 20, 
                      background: '#F8FAFC',
                      border: '1.5px solid #F1F5F9',
                      height: '100%'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          background: theme.primary, 
                          boxShadow: `0 0 0 4px ${theme.primary}20` 
                        }} />
                        <h5 style={{ fontWeight: 800, color: '#0F172A', margin: 0, fontSize: 15.5 }}>{item.title}</h5>
                      </div>
                      <p style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>

            {/* Why Doctor Booklet Section */}
            <Card style={{ 
              border: '1.5px solid #F1F5F9', 
              borderRadius: 24, 
              padding: '40px 36px', 
              boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
              background: 'white'
            }}>
              <h4 style={{ fontWeight: 800, color: '#0F172A', marginBottom: 28 }}>এই সেবায় আমাদের অনন্য বৈশিষ্ট্যসমূহ</h4>
              
              <Row className="g-4">
                {details.features.map((feat, idx) => (
                  <Col sm={6} key={idx}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ 
                        color: theme.primary, 
                        background: theme.secondary,
                        borderRadius: 10,
                        padding: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <IconCircleCheck size={20} stroke={2.5} />
                      </div>
                      <div>
                        <h6 style={{ fontWeight: 800, color: '#0F172A', margin: '0 0 4px', fontSize: 15 }}>{feat}</h6>
                        <span style={{ color: '#64748B', fontSize: 12.5 }}>মেডকানেক্ট এসিউরেন্স ভেরিফাইড</span>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          {/* Action HUD / Sidebar column */}
          <Col lg={4}>
            <div style={{ position: 'sticky', top: 120 }}>
              {/* Direct Booking HUD Card */}
              <Card style={{ 
                border: '1.5px solid #F1F5F9', 
                borderRadius: 24, 
                padding: 32, 
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                color: 'white',
                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
                marginBottom: 32,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Glowing backdrop circular bubble */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: -60, 
                  left: -60, 
                  width: 180, 
                  height: 180, 
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${theme.primary}30 0%, transparent 70%)` 
                }} />

                <h4 style={{ fontWeight: 900, marginBottom: 12, fontSize: 20 }}>অ্যাপয়েন্টমেন্ট নিন</h4>
                <p style={{ color: '#94A3B8', fontSize: 13.5, lineHeight: 1.7, marginBottom: 28 }}>
                  মেডকানেক্টের মাধ্যমে আপনার সুবিধাজনক সময়ে সেরা ডাক্তার এবং ডায়াগনস্টিক সেন্টারে বুকিং দিন একদম সহজে।
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 2 }}>
                  <Link to="/doctors" style={{ textDecoration: 'none' }}>
                    <Button style={{ 
                      width: '100%', 
                      background: theme.primary, 
                      borderColor: theme.primary, 
                      fontWeight: 800, 
                      fontSize: 14.5,
                      padding: '13px 20px',
                      borderRadius: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: `0 8px 20px ${theme.primary}30`,
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                    >
                      <IconStethoscope size={18} /> ডাক্তার খুঁজুন <IconArrowRight size={16} />
                    </Button>
                  </Link>

                  <Link to="/hospitals" style={{ textDecoration: 'none' }}>
                    <Button style={{ 
                      width: '100%', 
                      background: 'rgba(255, 255, 255, 0.08)', 
                      borderColor: 'rgba(255, 255, 255, 0.15)', 
                      color: 'white',
                      fontWeight: 800, 
                      fontSize: 14.5,
                      padding: '13px 20px',
                      borderRadius: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    }}
                    >
                      <IconBuildingHospital size={18} /> হাসপাতাল ও সেন্টার সমূহ
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Help & Support Card */}
              <Card style={{ 
                border: '1.5px solid #F1F5F9', 
                borderRadius: 24, 
                padding: '24px 28px', 
                background: 'white',
                boxShadow: '0 8px 30px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ 
                    color: '#00A88C', 
                    background: '#F0FDF4',
                    borderRadius: 12,
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconHeart size={20} />
                  </div>
                  <div>
                    <h6 style={{ fontWeight: 800, color: '#0F172A', margin: '0 0 2px' }}>২৪/৭ হেল্পলাইন সাপোর্ট</h6>
                    <span style={{ color: '#64748B', fontSize: 13, fontWeight: 700 }}>কল করুন: +৮৮০ ৯৬১২-৩৪৫৬৭৮</span>
                  </div>
                </div>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Similar Services Grid */}
      <section style={{ marginTop: 80, borderTop: '1px solid #E2E8F0', paddingTop: 60 }}>
        <Container>
          <h3 style={{ fontWeight: 900, color: '#0F172A', marginBottom: 36, textAlign: 'center' }}>মেডকানেক্টের অন্যান্য গুরুত্বপূর্ণ সেবাসমূহ</h3>
          
          <Row className="g-4">
            {similarServices.map((srv, idx) => {
              const srvTheme = CARD_THEMES[srv.icon] || DEFAULT_THEME;
              const srvIcon = ICON_MAP[srv.icon] || '🏥';

              return (
                <Col lg={4} md={6} key={srv.id}>
                  <Card 
                    onMouseEnter={() => setHoveredCard(srv.id)} 
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => navigate(`/services/${srv.id}`)}
                    style={{ 
                      border: '1.5px solid #F1F5F9', 
                      borderRadius: 20, 
                      padding: 24, 
                      boxShadow: hoveredCard === srv.id
                        ? `0 20px 40px -12px ${srvTheme.glow}`
                        : '0 4px 16px rgba(0,0,0,0.02)',
                      transform: hoveredCard === srv.id ? 'translateY(-6px)' : 'translateY(0)',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      background: 'white',
                      height: '100%',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ 
                      width: 52, 
                      height: 52, 
                      borderRadius: 14, 
                      background: srvTheme.secondary,
                      color: srvTheme.text,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      marginBottom: 16
                    }}>
                      {srvIcon}
                    </div>

                    <h5 style={{ fontWeight: 800, color: '#0F172A', marginBottom: 8, fontSize: 16.5 }}>
                      {srv.title_bn}
                    </h5>

                    <p style={{ 
                      color: '#64748B', 
                      fontSize: 13.5, 
                      lineHeight: 1.6, 
                      marginBottom: 16,
                      flexGrow: 1 
                    }}>
                      {srv.description_bn.slice(0, 75)}...
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: 14, marginTop: 'auto' }}>
                      <span style={{ color: srvTheme.primary, fontWeight: 800, fontSize: 13 }}>বিস্তারিত দেখুন</span>
                      <IconArrowRight size={14} color={srvTheme.primary} />
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Container>
      </section>
    </div>
  )
}

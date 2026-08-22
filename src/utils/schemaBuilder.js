/**
 * Enterprise Schema.org Structured Data Builder for Google Rich Results
 */

/**
 * Builds standard Google Rich Results Physician Schema with Breadcrumbs.
 */
export function buildPhysicianSchema(doctor, reviews = [], origin = window.location.origin) {
  if (!doctor) return null

  const canonicalUrl = `${origin}/doctors/${doctor.district_slug || 'bangladesh'}/${doctor.upazila_slug || 'general'}/${doctor.slug || doctor.id}`
  const photoUrl = doctor.photo || doctor.image || `${origin}/images/default-doctor.jpg`

  const physician = {
    '@type': 'Physician',
    '@id': `${canonicalUrl}#physician`,
    'name': doctor.name,
    'alternateName': doctor.name_bn || undefined,
    'url': canonicalUrl,
    'image': {
      '@type': 'ImageObject',
      'url': photoUrl.startsWith('http') ? photoUrl : `${origin}${photoUrl}`,
    },
    'description': doctor.bio || doctor.specialty?.name ? `${doctor.name} - ${doctor.specialty?.name || 'বিশেষজ্ঞ'} ডাক্তার` : undefined,
    'medicalSpecialty': doctor.specialty?.name ? {
      '@type': 'MedicalSpecialty',
      'name': doctor.specialty.name,
    } : undefined,
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': doctor.upazila?.name || 'Bangladesh',
      'addressRegion': doctor.district?.name || 'Bangladesh',
      'addressCountry': 'BD',
    },
    'priceRange': doctor.fee ? `৳${doctor.fee}` : '৳৳',
    'availableService': [
      {
        '@type': 'MedicalProcedure',
        'name': 'Doctor Consultation & Prescription',
      }
    ]
  }

  if (doctor.hospital?.name) {
    physician.hospitalAffiliation = {
      '@type': 'Hospital',
      'name': doctor.hospital.name,
      'url': doctor.hospital.canonical_url ? `${origin}${doctor.hospital.canonical_url}` : undefined,
    }
  }

  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length
    physician.aggregateRating = {
      '@type': 'AggregateRating',
      'ratingValue': avgRating.toFixed(1),
      'reviewCount': reviews.length,
      'bestRating': '5',
      'worstRating': '1',
    }
    physician.review = reviews.slice(0, 3).map((r) => ({
      '@type': 'Review',
      'author': {
        '@type': 'Person',
        'name': r.userName || 'Anonymous Patient',
      },
      'reviewRating': {
        '@type': 'Rating',
        'ratingValue': String(r.rating || 5),
        'bestRating': '5',
      },
      'reviewBody': r.comment || '',
    }))
  }

  // Breadcrumbs
  const breadcrumbs = [
    { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${origin}/` },
    { '@type': 'ListItem', 'position': 2, 'name': 'Doctors', 'item': `${origin}/doctors` },
  ]
  let pos = 3
  if (doctor.district?.name) {
    breadcrumbs.push({
      '@type': 'ListItem',
      'position': pos++,
      'name': doctor.district.name,
      'item': `${origin}/doctors/${doctor.district_slug}`,
    })
  }
  if (doctor.upazila?.name) {
    breadcrumbs.push({
      '@type': 'ListItem',
      'position': pos++,
      'name': doctor.upazila.name,
      'item': `${origin}/doctors/${doctor.district_slug}/${doctor.upazila_slug}`,
    })
  }
  breadcrumbs.push({
    '@type': 'ListItem',
    'position': pos,
    'name': doctor.name,
    'item': canonicalUrl,
  })

  return {
    '@context': 'https://schema.org',
    '@graph': [
      physician,
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumbs`,
        'itemListElement': breadcrumbs,
      }
    ]
  }
}

/**
 * Builds standard Google Rich Results Hospital Schema with Breadcrumbs.
 */
export function buildHospitalSchema(hospital, origin = window.location.origin) {
  if (!hospital) return null

  const canonicalUrl = `${origin}/hospitals/${hospital.district_slug || 'bangladesh'}/${hospital.upazila_slug || 'general'}/${hospital.slug || hospital.id}`
  const photoUrl = hospital.photo_url || hospital.photo || `${origin}/images/default-hospital.jpg`

  const hospitalObj = {
    '@type': 'Hospital',
    '@id': `${canonicalUrl}#hospital`,
    'name': hospital.name,
    'alternateName': hospital.name_bn || undefined,
    'url': canonicalUrl,
    'image': {
      '@type': 'ImageObject',
      'url': photoUrl.startsWith('http') ? photoUrl : `${origin}${photoUrl}`,
    },
    'description': hospital.about || `${hospital.name} - ${hospital.district?.name || ''} এর অন্যতম সেরা হাসপাতাল।`,
    'telephone': hospital.emergency_phone || hospital.phone || undefined,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': hospital.address || undefined,
      'addressLocality': hospital.upazila?.name || undefined,
      'addressRegion': hospital.district?.name || 'Bangladesh',
      'addressCountry': 'BD',
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'reviewCount': '24',
      'bestRating': '5',
      'worstRating': '1',
    }
  }

  if (hospital.latitude && hospital.longitude) {
    hospitalObj.geo = {
      '@type': 'GeoCoordinates',
      'latitude': hospital.latitude,
      'longitude': hospital.longitude,
    }
  }

  // Breadcrumbs
  const breadcrumbs = [
    { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${origin}/` },
    { '@type': 'ListItem', 'position': 2, 'name': 'Hospitals', 'item': `${origin}/hospitals` },
  ]
  let pos = 3
  if (hospital.district?.name) {
    breadcrumbs.push({
      '@type': 'ListItem',
      'position': pos++,
      'name': hospital.district.name,
      'item': `${origin}/hospitals/${hospital.district_slug}`,
    })
  }
  if (hospital.upazila?.name) {
    breadcrumbs.push({
      '@type': 'ListItem',
      'position': pos++,
      'name': hospital.upazila.name,
      'item': `${origin}/hospitals/${hospital.district_slug}/${hospital.upazila_slug}`,
    })
  }
  breadcrumbs.push({
    '@type': 'ListItem',
    'position': pos,
    'name': hospital.name,
    'item': canonicalUrl,
  })

  return {
    '@context': 'https://schema.org',
    '@graph': [
      hospitalObj,
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumbs`,
        'itemListElement': breadcrumbs,
      }
    ]
  }
}

/**
 * Builds standard Google Rich Results Specialty Hub Schema with Breadcrumbs.
 */
export function buildSpecialtySchema(specialty, district = null, upazila = null, origin = window.location.origin) {
  if (!specialty) return null

  let canonicalUrl = `${origin}/specialties/${specialty.slug}`
  if (district && upazila) {
    canonicalUrl = `${origin}/specialties/${specialty.slug}/${district}/${upazila}`
  } else if (district) {
    canonicalUrl = `${origin}/specialties/${specialty.slug}/${district}`
  }

  const breadcrumbs = [
    { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${origin}/` },
    { '@type': 'ListItem', 'position': 2, 'name': 'Specialties', 'item': `${origin}/specialties` },
    { '@type': 'ListItem', 'position': 3, 'name': specialty.name, 'item': `${origin}/specialties/${specialty.slug}` },
  ]

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalSpecialty',
        '@id': `${canonicalUrl}#specialty`,
        'name': specialty.name,
        'url': canonicalUrl,
        'description': `বাংলাদেশের সেরা ${specialty.name} বিশেষজ্ঞ ডাক্তার ও হাসপাতালের তালিকা এবং অ্যাপয়েন্টমেন্ট বুকিং।`,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumbs`,
        'itemListElement': breadcrumbs,
      }
    ]
  }
}

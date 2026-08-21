import { useEffect } from 'react'

/**
 * Enterprise SEO & Structured Data Head Manager
 */
export default function SeoHead({
  title = 'MedConnect — শীর্ষস্থানীয় ডাক্তার ও হাসপাতাল সেবা',
  description = 'অনলাইনে সেরা বিশেষজ্ঞ ডাক্তার ও হাসপাতালের তথ্য জানুন এবং সহজে সিরিয়াল ও অ্যাপয়েন্টমেন্ট বুকিং করুন।',
  canonicalUrl,
  ogImage = '/images/og-default.jpg',
  ogType = 'website',
  schemaData = null,
  noIndex = false,
}) {
  useEffect(() => {
    // 1. Page Title
    if (title) {
      document.title = title
    }

    const currentUrl = canonicalUrl || window.location.href

    // Helper to set or update a meta tag
    const setMeta = (attr, key, content) => {
      if (!content) return
      let el = document.querySelector(`meta[${attr}="${key}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    // 2. Canonical Link Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', currentUrl)

    // 3. Robots Directives
    setMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')

    // 4. Standard Open Graph Tags
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', currentUrl)
    setMeta('property', 'og:type', ogType)
    setMeta('property', 'og:image', ogImage.startsWith('http') ? ogImage : `${window.location.origin}${ogImage}`)
    setMeta('property', 'og:site_name', 'MedConnect')
    setMeta('property', 'og:locale', 'bn_BD')

    // 5. Twitter Card Tags
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', ogImage.startsWith('http') ? ogImage : `${window.location.origin}${ogImage}`)

    // 6. JSON-LD Structured Data
    let scriptTag = document.querySelector('script[data-schema="medconnect-seo"]')
    if (schemaData) {
      if (!scriptTag) {
        scriptTag = document.createElement('script')
        scriptTag.setAttribute('type', 'application/ld+json')
        scriptTag.setAttribute('data-schema', 'medconnect-seo')
        document.head.appendChild(scriptTag)
      }
      scriptTag.textContent = JSON.stringify(schemaData)
    } else if (scriptTag) {
      scriptTag.remove()
    }

    return () => {
      // Clean up dynamic schema tag on unmount if needed
      const tag = document.querySelector('script[data-schema="medconnect-seo"]')
      if (tag) tag.remove()
    }
  }, [title, description, canonicalUrl, ogImage, ogType, schemaData, noIndex])

  return null
}

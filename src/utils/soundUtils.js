/**
 * Audio Chime and Voice Announcement Utility for Medical Queue & Display Boards.
 * Uses pure HTML5 Web Audio API (zero external mp3 file dependencies, 100% offline & fast).
 */

class SoundService {
  constructor() {
    this.audioCtx = null
    this.isMuted = false
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        this.audioCtx = new AudioContext()
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {})
    }
    return this.audioCtx
  }

  /**
   * Play professional hospital dual-tone bell chime ("Ding-Dong").
   */
  playChime() {
    if (this.isMuted) return
    try {
      const ctx = this.getAudioContext()
      if (!ctx) return

      const now = ctx.currentTime

      // Tone 1: High crisp bell (587.33 Hz - D5)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(587.33, now)
      gain1.gain.setValueAtTime(0.3, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.6)

      // Tone 2: Warm resolving bell (440 Hz - A4 or 392 Hz - G4)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(440.0, now + 0.2)
      gain2.gain.setValueAtTime(0.35, now + 0.2)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.2)
      osc2.stop(now + 1.2)
    } catch (e) {
      console.warn('Audio playback not permitted or unavailable:', e)
    }
  }

  /**
   * Announce patient serial with speech synthesis (Bangla / English).
   */
  announceSerial({ serialNumber, roomNumber, doctorName, lang = 'bn' }) {
    if (this.isMuted) return
    this.playChime()

    if (!('speechSynthesis' in window)) return

    // Small timeout after the chime tone
    setTimeout(() => {
      try {
        window.speechSynthesis.cancel() // Stop any previous speech
        let text = ''
        if (lang === 'bn') {
          text = `সিরিয়াল নাম্বার ${serialNumber}`
          if (roomNumber) text += `, রুম ${roomNumber}`
        } else {
          text = `Serial number ${serialNumber}`
          if (roomNumber) text += `, Room ${roomNumber}`
        }

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.95
        utterance.pitch = 1.05

        // Pick matching voice if available
        const voices = window.speechSynthesis.getVoices() || []
        const targetVoice = voices.find(v => v.lang && v.lang.startsWith(lang === 'bn' ? 'bn' : 'en'))
        if (targetVoice) utterance.voice = targetVoice

        window.speechSynthesis.speak(utterance)
      } catch (err) {
        console.warn('Speech synthesis error:', err)
      }
    }, 450)
  }

  setMuted(muted) {
    this.isMuted = muted
  }
}

export const soundService = new SoundService()
export default soundService

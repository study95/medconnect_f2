import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import axiosInstance from '../api/axiosInstance'

// Attach Pusher to window object for Laravel Echo
window.Pusher = Pusher

// Singleton Echo instance
let echoInstance = null

// Channel subscription registry for reference counting and memory leak prevention
// Map<channelKey, { channel: EchoChannel, subscribers: Set<callback>, lastSequence: number }>
const channelRegistry = new Map()

// Connection state listeners
const connectionListeners = new Set()
let connectionState = 'disconnected'

/**
 * Get or initialize the singleton Laravel Echo client.
 */
export const getEcho = () => {
  if (echoInstance) {
    return echoInstance
  }

  const reverbKey = import.meta.env.VITE_REVERB_APP_KEY || 'di3ir9ilwnjbcg6ddqp3'
  const reverbHost = import.meta.env.VITE_REVERB_HOST || window.location.hostname || 'localhost'
  const reverbPort = Number(import.meta.env.VITE_REVERB_PORT || 8080)
  const reverbScheme = (import.meta.env.VITE_REVERB_SCHEME || 'http').toLowerCase()
  const isTls = reverbScheme === 'https'

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: reverbKey,
    wsHost: reverbHost,
    wsPort: reverbPort,
    wssPort: reverbPort,
    forceTLS: isTls,
    enabledTransports: ['ws', 'wss'],
    // Custom authorizer using axiosInstance for automatic Sanctum Bearer token resolution
    authorizer: (channel) => {
      return {
        authorize: (socketId, callback) => {
          const token = localStorage.getItem('token')
          axiosInstance
            .post(
              '/broadcasting/auth',
              {
                socket_id: socketId,
                channel_name: channel.name,
              },
              {
                headers: {
                  Authorization: token ? `Bearer ${token}` : '',
                },
                skipGlobalToast: true,
              }
            )
            .then((response) => {
              callback(null, response.data)
            })
            .catch((error) => {
              console.error('Broadcasting channel authorization failed:', error)
              callback(error)
            })
        },
      }
    },
  })

  // Monitor Reverb / Pusher connection lifecycle
  if (echoInstance.connector?.pusher?.connection) {
    const conn = echoInstance.connector.pusher.connection

    conn.bind('state_change', (states) => {
      connectionState = states.current
      connectionListeners.forEach((listener) => {
        try {
          listener(states.current, states.previous)
        } catch (e) {
          console.error('Echo connection listener error:', e)
        }
      })
    })

    conn.bind('error', (err) => {
      console.warn('Reverb WebSocket connection warning:', err)
    })

    conn.bind('connected', () => {
      connectionState = 'connected'
    })

    conn.bind('disconnected', () => {
      connectionState = 'disconnected'
    })

    conn.bind('unavailable', () => {
      connectionState = 'unavailable'
    })
  }

  return echoInstance
}

/**
 * Register a listener for WebSocket connection state transitions.
 * @param {Function} callback (currentState, previousState) => void
 * @returns {Function} unsubscribe function
 */
export const onConnectionStateChange = (callback) => {
  connectionListeners.add(callback)
  callback(connectionState, null)
  return () => {
    connectionListeners.delete(callback)
  }
}

/**
 * Internal helper to manage reference-counted channel subscriptions.
 */
const subscribeInternal = (channelType, channelName, onUpdate) => {
  const echo = getEcho()
  const channelKey = `${channelType}:${channelName}`

  if (!channelRegistry.has(channelKey)) {
    let channel
    if (channelType === 'private') {
      channel = echo.private(channelName)
    } else if (channelType === 'presence') {
      channel = echo.join(channelName)
    } else {
      channel = echo.channel(channelName)
    }

    const entry = {
      channel,
      subscribers: new Set(),
      lastSequence: 0,
    }

    // Listen for queue updates with monotonic sequence ordering
    channel.listen('.queue.updated', (event) => {
      // Drop out-of-order or duplicate packets if sequence_number is present
      if (typeof event?.sequence_number === 'number') {
        if (event.sequence_number <= entry.lastSequence) {
          return
        }
        entry.lastSequence = event.sequence_number
      }

      // Notify all registered subscribers
      entry.subscribers.forEach((callback) => {
        try {
          callback(event)
        } catch (err) {
          console.error('Queue update subscriber callback error:', err)
        }
      })
    })

    channelRegistry.set(channelKey, entry)
  }

  const entry = channelRegistry.get(channelKey)
  entry.subscribers.add(onUpdate)

  // Return unsubscribe cleanup function for React useEffect
  return () => {
    if (channelRegistry.has(channelKey)) {
      const currentEntry = channelRegistry.get(channelKey)
      currentEntry.subscribers.delete(onUpdate)

      // When no more subscribers exist, leave the channel and free resources
      if (currentEntry.subscribers.size === 0) {
        if (channelType === 'private' || channelType === 'presence') {
          echo.leave(channelName)
        } else {
          echo.leaveChannel(channelName)
        }
        channelRegistry.delete(channelKey)
      }
    }
  }
}

/**
 * Subscribe to real-time live queue updates for a specific appointment.
 * Channel: private-appointment.{registration_id}
 *
 * @param {string} registrationId - The appointment's official registration ID
 * @param {Function} onUpdate - Callback receiving QueueStateUpdated payload
 * @returns {Function} Unsubscribe cleanup function
 */
export const subscribeToAppointment = (registrationId, onUpdate) => {
  if (!registrationId || typeof onUpdate !== 'function') {
    return () => {}
  }
  return subscribeInternal('private', `appointment.${registrationId}`, onUpdate)
}

/**
 * Subscribe to private chamber queue management updates (Doctor / Hospital manager).
 * Channel: private-chamber.{display_token}
 *
 * @param {string} displayToken - The chamber's 32-character display token
 * @param {Function} onUpdate - Callback receiving QueueStateUpdated payload
 * @returns {Function} Unsubscribe cleanup function
 */
export const subscribeToChamber = (displayToken, onUpdate) => {
  if (!displayToken || typeof onUpdate !== 'function') {
    return () => {}
  }
  return subscribeInternal('private', `chamber.${displayToken}`, onUpdate)
}

/**
 * Subscribe to public chamber display board updates (Lounge TV displays, zero auth).
 * Channel: public-chamber.{display_token}
 *
 * @param {string} displayToken - The chamber's 32-character display token
 * @param {Function} onUpdate - Callback receiving QueueStateUpdated payload
 * @returns {Function} Unsubscribe cleanup function
 */
export const subscribeToPublicChamber = (displayToken, onUpdate) => {
  if (!displayToken || typeof onUpdate !== 'function') {
    return () => {}
  }
  return subscribeInternal('public', `public-chamber.${displayToken}`, onUpdate)
}

/**
 * Manually leave a channel and remove all its subscribers.
 * @param {string} channelName
 */
export const leaveChannel = (channelName) => {
  if (!channelName || !echoInstance) return

  // Clean from registry
  for (const [key, entry] of channelRegistry.entries()) {
    if (key.endsWith(`:${channelName}`)) {
      entry.subscribers.clear()
      channelRegistry.delete(key)
    }
  }

  echoInstance.leave(channelName)
}

/**
 * Disconnect the Echo WebSocket client completely.
 */
export const disconnectEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect()
    channelRegistry.clear()
    echoInstance = null
    connectionState = 'disconnected'
  }
}

export default {
  getEcho,
  subscribeToAppointment,
  subscribeToChamber,
  subscribeToPublicChamber,
  leaveChannel,
  disconnectEcho,
  onConnectionStateChange,
}

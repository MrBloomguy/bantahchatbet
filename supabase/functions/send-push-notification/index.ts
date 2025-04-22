// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_node_server

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import webpush from 'npm:web-push@3.6.7'

// Set VAPID keys - these should be stored as environment variables in production
const VAPID_PUBLIC_KEY = 'BMRTg6RSFC44oDE9Nf7drNX-cqAKhvCfHwbzVmuSE9VEMcjTJ9QclzWFBjZo_Kfz7psQ6KPTorG04XgF75QKMPY'
const VAPID_PRIVATE_KEY = 'wqmcTt58r4a3pmpTvnta0jNRCdHAi_eBig7lV6E2e9s'

// Configure web-push
webpush.setVapidDetails(
  'mailto:your-email@example.com', // Replace with your email
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

serve(async (req) => {
  // This is needed to handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  try {
    // Get the request body
    const { subscription, notification } = await req.json()

    if (!subscription || !notification) {
      return new Response(
        JSON.stringify({ error: 'Missing subscription or notification data' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Send the push notification
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(notification)
    )

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error sending push notification:', error)

    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send notification' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

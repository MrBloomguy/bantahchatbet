// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Define the request body type
interface RequestBody {
  to: string;
  message: string;
}

// Define the response type
interface ResponseBody {
  success: boolean;
  message: string;
  sid?: string;
}

serve(async (req) => {
  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers, status: 204 });
  }

  try {
    // Parse the request body
    const body: RequestBody = await req.json();
    const { to, message } = body;

    // Validate the request
    if (!to || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing required parameters: to, message",
        }),
        { headers, status: 400 }
      );
    }

    // Twilio credentials from environment variables
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing Twilio credentials in environment variables",
        }),
        { headers, status: 500 }
      );
    }

    // Create the request URL and body
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const formData = new URLSearchParams();
    formData.append("To", to);
    formData.append("From", twilioNumber);
    formData.append("Body", message);

    // Create authorization header
    const auth = btoa(`${accountSid}:${authToken}`);

    // Make the API request to Twilio
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    // Parse the response
    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          message: data.message || "Failed to send SMS",
        }),
        { headers, status: response.status }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "SMS sent successfully",
        sid: data.sid,
      }),
      { headers, status: 200 }
    );
  } catch (error) {
    // Handle errors
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Internal server error",
      }),
      { headers, status: 500 }
    );
  }
});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/send-sms' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
//   --header 'Content-Type: application/json' \
//   --data '{"to":"+1234567890","message":"Hello from Supabase Edge Function!"}'

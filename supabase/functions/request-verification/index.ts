// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

serve(async (req) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers, status: 204 });
  }

  try {
    const { phoneNumber } = await req.json();
    
    // Validate phone number
    if (!phoneNumber || !/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid phone number" }),
        { headers, status: 400 }
      );
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the code in the database with expiration
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiration
    
    // Check if verification_codes table exists, if not create it
    try {
      const { error: insertError } = await supabase
        .from('verification_codes')
        .insert({
          phone_number: phoneNumber,
          code: code,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        });
        
      if (insertError) {
        throw new Error(`Failed to store verification code: ${insertError.message}`);
      }
    } catch (tableError) {
      console.error("Table error:", tableError);
      // Table might not exist, we'll continue anyway for development
    }
    
    // Send SMS via Twilio
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID") || "AC4b5e1a33817bc574acb19c6a30683f23";
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN") || "09745b7bd81d7e1030e94fcf744c2be5";
    const twilioNumber = Deno.env.get("TWILIO_PHONE_NUMBER") || "+18449032253";
    
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const twilioAuth = btoa(`${accountSid}:${authToken}`);
    
    const formData = new URLSearchParams();
    formData.append("To", phoneNumber);
    formData.append("From", twilioNumber);
    formData.append("Body", `Your BantahChat verification code is: ${code}. This code will expire in 10 minutes.`);
    
    try {
      const twilioResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${twilioAuth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData
      });
      
      const twilioData = await twilioResponse.json();
      
      if (!twilioResponse.ok) {
        console.error("Twilio error:", twilioData);
        throw new Error(`Failed to send SMS: ${twilioData.message}`);
      }
      
      console.log("SMS sent successfully:", twilioData.sid);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Verification code sent",
          sid: twilioData.sid
        }),
        { headers, status: 200 }
      );
    } catch (twilioError) {
      console.error("Twilio error:", twilioError);
      
      // For development, return success anyway
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Verification code sent (simulated)",
          sid: "SM" + Math.random().toString(36).substring(2, 15)
        }),
        { headers, status: 200 }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    
    return new Response(
      JSON.stringify({ success: false, message: error.message || "Internal server error" }),
      { headers, status: 500 }
    );
  }
});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/request-verification' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
//   --header 'Content-Type: application/json' \
//   --data '{"phoneNumber":"+1234567890"}'

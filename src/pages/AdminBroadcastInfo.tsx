import React from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { AlertTriangle, Info } from 'lucide-react';

const AdminBroadcastInfo: React.FC = () => {
  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="bg-[#242538] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Info className="w-5 h-5 text-[#CCFF00]" />
            Broadcast Notifications Setup Guide
          </h2>

          <div className="mb-6 p-4 bg-amber-500/10 text-amber-400 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">
                The broadcast feature requires additional server-side setup to work properly.
              </p>
              <p className="text-sm mt-2">
                Due to Supabase Row-Level Security (RLS) policies, direct insertion of notifications and messages
                from the client-side is restricted for security reasons.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Option 1: Create a Database Function</h3>
              <div className="bg-[#1a1b2e] p-4 rounded-lg">
                <p className="text-white/80 mb-4">
                  Create a PostgreSQL function in your Supabase database that can bypass RLS:
                </p>
                <pre className="bg-black/50 p-3 rounded text-green-400 text-sm overflow-x-auto">
{`-- Create this function in the SQL editor
CREATE OR REPLACE FUNCTION create_admin_notifications(notifications_data JSONB)
RETURNS VOID AS $$
BEGIN
  -- This runs with security definer permissions (bypasses RLS)
  INSERT INTO notifications 
  SELECT * FROM jsonb_populate_recordset(null::notifications, notifications_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also create one for messages
CREATE OR REPLACE FUNCTION create_admin_messages(messages_data JSONB)
RETURNS VOID AS $$
BEGIN
  -- This runs with security definer permissions (bypasses RLS)
  INSERT INTO private_messages 
  SELECT * FROM jsonb_populate_recordset(null::private_messages, messages_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Option 2: Create an Admin Events Table</h3>
              <div className="bg-[#1a1b2e] p-4 rounded-lg">
                <p className="text-white/80 mb-4">
                  Create a table to store admin events and process them with a Supabase Edge Function:
                </p>
                <pre className="bg-black/50 p-3 rounded text-green-400 text-sm overflow-x-auto">
{`-- Create this table in the SQL editor
CREATE TABLE admin_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create RLS policy to allow admins to insert
CREATE POLICY "Allow admins to insert events" 
ON admin_events FOR INSERT 
TO authenticated
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Option 3: Create a Serverless Function</h3>
              <div className="bg-[#1a1b2e] p-4 rounded-lg">
                <p className="text-white/80 mb-4">
                  Create a Supabase Edge Function to handle broadcast operations:
                </p>
                <pre className="bg-black/50 p-3 rounded text-green-400 text-sm overflow-x-auto">
{`// Create a new Edge Function in Supabase
// This is a simplified example
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'

serve(async (req) => {
  const { notifications, messages, targetUsers } = await req.json()
  
  // Create a Supabase client with the service role key
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Service role can bypass RLS
  if (notifications) {
    const { error } = await supabase
      .from('notifications')
      .insert(notifications)
  }
  
  if (messages) {
    const { error } = await supabase
      .from('private_messages')
      .insert(messages)
  }
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})`}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-500/10 text-blue-400 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Next Steps</h3>
            <p className="text-sm">
              Once you've implemented one of these solutions, the broadcast feature will work properly.
              Until then, the UI will show success messages, but notifications may not be delivered to users.
            </p>
            <p className="text-sm mt-2">
              For assistance with implementation, please contact your development team.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBroadcastInfo;

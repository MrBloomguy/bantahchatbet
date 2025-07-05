import express from 'express';
import { supabase } from '../lib/supabase.js';
import cors from 'cors';

const router = express.Router();

// Enable CORS for API endpoints
router.use(cors());

/**
 * Data Deletion API Endpoint
 * 
 * This endpoint allows external applications to programmatically request
 * data deletion for a user without requiring user interaction.
 * 
 * Required parameters:
 * - user_id: The ID of the user whose data should be deleted
 * - app_id: The ID of the application making the request
 * - token: A valid API token for authentication
 */
router.post('/api/data-deletion', async (req, res) => {
  try {
    const { user_id, app_id, token } = req.body;
    
    // Validate required parameters
    if (!user_id || !app_id || !token) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    // Verify the app_id and token
    const { data: appData, error: appError } = await supabase
      .from('external_apps')
      .select('*')
      .eq('app_id', app_id)
      .single();
      
    if (appError || !appData) {
      return res.status(401).json({
        success: false,
        error: 'Invalid app_id'
      });
    }
    
    // Verify that the token is valid for this app
    if (appData.token !== token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();
      
    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Submit data deletion request
    const { error: insertError } = await supabase
      .from('data_deletion_requests')
      .insert({
        user_id,
        reason: 'Requested via API',
        status: 'pending',
        requested_at: new Date().toISOString(),
        source: 'api',
        app_id
      });
      
    if (insertError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to submit deletion request'
      });
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Data deletion request submitted successfully',
      request_id: `${user_id}-${Date.now()}`,
      estimated_completion_days: 30
    });
    
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;

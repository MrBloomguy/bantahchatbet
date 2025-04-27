import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Trash2, CheckCircle, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const DataDeletionCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Get parameters from URL
  const userIdParam = searchParams.get('user_id');
  const tokenParam = searchParams.get('token');
  const appIdParam = searchParams.get('app_id');
  const sourceParam = searchParams.get('source');

  useEffect(() => {
    const validateRequest = async () => {
      try {
        setLoading(true);
        
        // Validate required parameters
        if (!userIdParam) {
          throw new Error('Missing user_id parameter');
        }
        
        // For external app requests, validate token and app_id
        if (sourceParam === 'external') {
          if (!tokenParam || !appIdParam) {
            throw new Error('Missing required parameters for external request');
          }
          
          // Verify the token against your database or authentication system
          // This is a simplified example - implement proper token validation
          const { data: appData, error: appError } = await supabase
            .from('external_apps')
            .select('*')
            .eq('app_id', appIdParam)
            .single();
            
          if (appError || !appData) {
            throw new Error('Invalid app_id');
          }
          
          // Verify that the token is valid for this app
          // This is a simplified example - implement proper token validation
          if (appData.token !== tokenParam) {
            throw new Error('Invalid token');
          }
        }
        
        // Check if user exists
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, name')
          .eq('id', userIdParam)
          .single();
          
        if (userError || !userData) {
          throw new Error('User not found');
        }
        
        // Set user ID for the form
        setUserId(userData.id);
        setError(null);
      } catch (err: any) {
        console.error('Validation error:', err);
        setError(err.message || 'Failed to validate request');
      } finally {
        setLoading(false);
      }
    };
    
    validateRequest();
  }, [userIdParam, tokenParam, appIdParam, sourceParam]);

  const handleSubmitDeletion = async () => {
    if (!userId || !confirmed) return;
    
    try {
      setLoading(true);
      
      // Submit data deletion request to database
      const { error } = await supabase
        .from('data_deletion_requests')
        .insert({
          user_id: userId,
          reason: 'Requested via external callback',
          status: 'pending',
          requested_at: new Date().toISOString(),
          source: sourceParam || 'callback',
          app_id: appIdParam
        });
        
      if (error) throw error;
      
      setSuccess(true);
      toast.success('Data deletion request submitted successfully');
    } catch (err: any) {
      console.error('Error submitting deletion request:', err);
      setError(err.message || 'Failed to submit deletion request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Data Deletion Request</h1>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Validating request...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Home
                </button>
              </div>
            </div>
          ) : success ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Request Submitted Successfully</h2>
              <p className="text-gray-600 mb-6">
                Your data deletion request has been submitted. We will process it within 30 days.
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to Home
              </button>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-center mb-6">
                You are about to request the deletion of your personal data from our systems.
                This action cannot be undone.
              </p>
              
              <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Your account will be deactivated</li>
                        <li>All your personal information will be removed</li>
                        <li>This process will be completed within 30 days</li>
                        <li>This action cannot be reversed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="confirm"
                      name="confirm"
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="confirm" className="font-medium text-gray-700">
                      I understand and confirm that I want to delete my data
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSubmitDeletion}
                  disabled={!confirmed || loading}
                  className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                    confirmed && !loading
                      ? 'bg-red-500 text-white hover:bg-red-600 transition-colors'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" color="#FFFFFF" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Confirm Deletion Request
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  disabled={loading}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          If you have any questions, please contact{' '}
          <a href="mailto:support@bantah.app" className="text-blue-600 hover:text-blue-800">
            support@bantah.app
          </a>
        </p>
      </div>
    </div>
  );
};

export default DataDeletionCallback;

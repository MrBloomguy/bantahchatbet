import React, { useState } from 'react';
import { Trash2, AlertCircle, Shield, UserCheck, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { privyDIDtoUUID } from '../utils/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import MobileFooterNav from '../components/MobileFooterNav';

const DataDeletionRequest: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const sections = [
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: 'Data Protection',
      content: 'We take your privacy seriously and respect your right to control your personal data.',
      details: [
        'We will remove your personal information from our active systems',
        'Your account will be deactivated after processing',
        'We will retain only the minimum information required by law'
      ]
    },
    {
      icon: <UserCheck className="w-6 h-6 text-primary" />,
      title: 'Your Rights',
      content: 'Under data protection laws, you have several important rights regarding your data.',
      details: [
        'Request deletion of your personal data',
        'Access the personal data we hold about you',
        'Request correction of any incomplete or inaccurate data'
      ]
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !confirmed) return;

    try {
      setLoading(true);
      const userId = privyDIDtoUUID(currentUser.id);

      // Submit data deletion request to database
      const { error } = await supabase
        .from('data_deletion_requests')
        .insert({
          user_id: userId,
          reason: reason.trim(),
          status: 'pending',
          requested_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Your data deletion request has been submitted. We will process it within 30 days.');
      navigate('/settings');
    } catch (error) {
      console.error('Error submitting data deletion request:', error);
      toast.error('Failed to submit data deletion request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-[72px]">
      <PageHeader title="Data Deletion Request" />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Hero section */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Deletion Request</h1>
            <p className="text-gray-600 max-w-md">
              Request the deletion of your personal data from our systems. We respect your right to privacy and control over your information.
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center">
                    {section.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">{section.title}</h2>
                    <p className="text-gray-600 mb-3">{section.content}</p>

                    <ul className="space-y-2">
                      {section.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Request Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Deletion Request</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Reason for deletion (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Please tell us why you're requesting data deletion"
                  rows={4}
                  maxLength={500}
                  disabled={loading}
                />
              </div>

              <div className="flex items-start gap-3 mt-4">
                <input
                  type="checkbox"
                  id="confirm"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  disabled={loading}
                />
                <label htmlFor="confirm" className="text-gray-700 text-sm">
                  I understand that this action will delete my account and personal data, and cannot be undone.
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
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
                      Request Data Deletion
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  disabled={loading}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>

          {/* Important Note */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-gray-900">Important Note</h2>
            </div>
            <p className="text-gray-600 mb-2">
              Your data deletion request will be processed within 30 days. During this time:
            </p>
            <ul className="space-y-1 text-gray-700 text-sm list-disc pl-5">
              <li>You can continue to use your account until the deletion is processed</li>
              <li>You can cancel your deletion request by contacting support</li>
              <li>Once processed, this action cannot be undone</li>
            </ul>
          </div>
        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default DataDeletionRequest;

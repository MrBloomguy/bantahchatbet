import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Clock, CheckSquare, AlertTriangle, FileCheck } from 'lucide-react';

interface EvidenceVerificationProps {
  challenge: {
    id: string;
    evidence: {
      url: string;
      type: string;
      metadata?: any;
    }[];
  };
  onVerificationComplete: (verified: boolean) => void;
}

const VERIFICATION_CHECKLIST = [
  { id: 'timestamp', label: 'Timestamp Verification', description: 'Check if evidence timestamp matches challenge period' },
  { id: 'quality', label: 'Quality Check', description: 'Evidence is clear and visible' },
  { id: 'authenticity', label: 'Authenticity Verification', description: 'No signs of manipulation or editing' },
  { id: 'relevance', label: 'Challenge Relevance', description: 'Evidence is relevant to the challenge requirements' }
];

export const EvidenceVerificationPanel: React.FC<EvidenceVerificationProps> = ({
  challenge,
  onVerificationComplete
}) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [existingReviews, setExistingReviews] = useState<any[]>([]);

  useEffect(() => {
    loadExistingReviews();
  }, [challenge.id]);

  const loadExistingReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('evidence_reviews')
        .select(`
          *,
          admin:users(name)
        `)
        .eq('verification_id', challenge.id);

      if (error) throw error;
      setExistingReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.showError('Failed to load existing reviews');
    }
  };

  const handleChecklistChange = (itemId: string, checked: boolean) => {
    setChecklist(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  const submitVerification = async (approved: boolean) => {
    try {
      setLoading(true);

      // Create or update verification record
      const { data: verificationData, error: verificationError } = await supabase
        .from('evidence_verifications')
        .upsert({
          challenge_id: challenge.id,
          evidence_url: challenge.evidence[0]?.url,
          metadata: {
            file_type: challenge.evidence[0]?.type,
            verified_at: new Date().toISOString(),
            verified_by: currentUser?.id
          },
          status: approved ? 'verified' : 'rejected',
          verification_checklist: Object.entries(checklist).map(([id, value]) => ({
            id,
            verified: value,
            verified_at: new Date().toISOString()
          }))
        })
        .select()
        .single();

      if (verificationError) throw verificationError;

      // Create review record
      const { error: reviewError } = await supabase
        .from('evidence_reviews')
        .insert({
          verification_id: verificationData.id,
          admin_id: currentUser?.id,
          status: approved ? 'approved' : 'rejected',
          notes,
          checklist_results: checklist
        });

      if (reviewError) throw reviewError;

      toast.showSuccess('Evidence verification submitted successfully');
      onVerificationComplete(approved);
      await loadExistingReviews();
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.showError('Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1b2e] rounded-xl p-4 space-y-4">
      <h3 className="text-white font-medium">Evidence Verification</h3>

      {/* Evidence Display */}
      <div className="grid grid-cols-1 gap-4">
        {challenge.evidence.map((item, index) => (
          <div key={index} className="relative">
            {item.type.startsWith('image') ? (
              <img 
                src={item.url} 
                alt="Evidence" 
                className="rounded-lg w-full"
              />
            ) : (
              <video 
                src={item.url} 
                controls 
                className="rounded-lg w-full"
              />
            )}
            <div className="absolute top-2 right-2 bg-black/50 rounded-lg px-2 py-1 text-sm">
              {new Date(item.metadata?.timestamp || '').toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Verification Checklist */}
      <div className="space-y-2">
        <h4 className="text-white/60">Verification Checklist</h4>
        {VERIFICATION_CHECKLIST.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={item.id}
              checked={checklist[item.id] || false}
              onChange={(e) => handleChecklistChange(item.id, e.target.checked)}
              className="rounded border-gray-600"
            />
            <label htmlFor={item.id} className="text-white">
              {item.label}
              <p className="text-white/60 text-sm">{item.description}</p>
            </label>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <h4 className="text-white/60 mb-2">Verification Notes</h4>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-black/20 rounded-lg p-2 text-white"
          rows={3}
          placeholder="Add any additional notes about the verification..."
        />
      </div>

      {/* Existing Reviews */}
      {existingReviews.length > 0 && (
        <div>
          <h4 className="text-white/60 mb-2">Previous Reviews</h4>
          <div className="space-y-2">
            {existingReviews.map(review => (
              <div key={review.id} className="bg-black/20 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <span className="text-white">{review.admin.name}</span>
                  <span className="text-white/60">•</span>
                  <span className="text-white/60">{new Date(review.created_at).toLocaleString()}</span>
                </div>
                <div className={`text-sm ${review.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                  {review.status.toUpperCase()}
                </div>
                {review.notes && (
                  <p className="text-white/60 text-sm mt-1">{review.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => submitVerification(true)}
          disabled={loading}
          className="flex-1 bg-green-500 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
        >
          <CheckSquare className="w-4 h-4" />
          Approve Evidence
        </button>
        <button
          onClick={() => submitVerification(false)}
          disabled={loading}
          className="flex-1 bg-red-500 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          Reject Evidence
        </button>
      </div>
    </div>
  );
};
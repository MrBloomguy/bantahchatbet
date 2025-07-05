import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import AdminLayout from '../layouts/AdminLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Report } from '../hooks/useAdmin';

const AdminReports: React.FC = () => {
  const { loading, getReports, resolveReport } = useAdmin();
  const [reports, setReports] = useState<Report[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      const data = await getReports();
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolveReport = async (reportId: string, action: 'approve' | 'reject') => {
    setProcessingId(reportId);
    try {
      const success = await resolveReport(reportId, action);
      if (success) {
        await loadReports();
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Reports Management</h1>
        
        <div className="space-y-4">
          {reports.map((report) => (
            <div 
              key={report.id} 
              className="bg-[#242538] rounded-xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-sm">
                    Reported by @{report.reporter.username}
                  </p>
                  <p className="text-white font-medium">
                    {report.type === 'user' ? '@' : ''}{report.reported.username}
                  </p>
                  <p className="text-white/80 mt-2">
                    {report.reason}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResolveReport(report.id, 'approve')}
                    disabled={!!processingId}
                    className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {processingId === report.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleResolveReport(report.id, 'reject')}
                    disabled={!!processingId}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-white/40">
                Reported {new Date(report.created_at).toLocaleString()}
              </div>
            </div>
          ))}

          {reports.length === 0 && (
            <div className="text-center py-8 text-white/60">
              No pending reports
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import AdminLayout from '../layouts/AdminLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import type { AdminAction } from '../hooks/useAdmin';

const AdminAuditLog: React.FC = () => {
  const { loading, getAuditLog } = useAdmin();
  const [actions, setActions] = useState<AdminAction[]>([]);

  const loadAuditLog = async () => {
    try {
      const data = await getAuditLog();
      setActions(data);
    } catch (error) {
      console.error('Error loading audit log:', error);
    }
  };

  useEffect(() => {
    loadAuditLog();
  }, []);

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
        <h1 className="text-2xl font-bold text-white mb-6">Audit Log</h1>
        
        <div className="space-y-4">
          {actions.map((action) => (
            <div 
              key={action.id} 
              className="bg-[#242538] rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#CCFF00]/20 rounded-lg flex-shrink-0">
                  <Clock className="w-5 h-5 text-[#CCFF00]" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {action.action_type} {action.target_type}
                  </p>
                  <p className="text-white/60 text-sm mt-1">
                    By {action.admin.name}
                  </p>
                  <div className="mt-2 text-sm text-white/80">
                    {Object.entries(action.details).map(([key, value]) => (
                      <div key={key} className="mt-1">
                        <span className="text-white/40">{key}:</span>{' '}
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-white/40">
                    {new Date(action.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {actions.length === 0 && (
            <div className="text-center py-8 text-white/60">
              No audit log entries
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLog;
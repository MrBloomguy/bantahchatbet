import { Dialog } from '@radix-ui/react-dialog';
import { AlertCircle, X } from 'lucide-react';

interface EventStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EventStartedModal({ isOpen, onClose }: EventStartedModalProps) {
  return (
    <Dialog open={isOpen}>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
          
          <div className="relative bg-[#242538] rounded-xl w-full max-w-sm p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Cannot Edit Event</h3>
                <p className="text-white/60 text-sm">This event has already started and cannot be edited. Only upcoming events can be modified.</p>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#CCFF00] text-black rounded-lg font-medium hover:bg-[#CCFF00]/90 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
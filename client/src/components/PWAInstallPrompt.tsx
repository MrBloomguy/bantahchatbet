import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
    setDeferredPrompt(null);
  };

  if (!showInstallButton) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-20 right-4 z-50 bg-[#7440FF] text-white rounded-xl p-4 shadow-lg flex items-center gap-2 hover:bg-[#5930CC] transition-colors duration-200"
    >
      <Download className="w-5 h-5" />
      <span className="font-medium">Add Bantah to Home Screen</span>
    </button>
  );
};

export default PWAInstallPrompt;

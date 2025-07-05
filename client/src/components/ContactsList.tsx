import React, { useState } from 'react';
import { Users, Phone } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface Contact {
  name: string[];
  email?: string[];
  tel?: string[];
}

export const ContactsList = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const toast = useToast();

  React.useEffect(() => {
    setIsSupported('contacts' in navigator && 'ContactsManager' in window);
  }, []);

  const handleSelectContacts = async () => {
    try {
      const properties = ['name', 'email', 'tel'];
      const opts = { multiple: true };
      
      // @ts-ignore - TypeScript doesn't recognize the contacts API yet
      const contacts = await navigator.contacts.select(properties, opts);
      setContacts(contacts);
    } catch (error) {
      console.error('Error selecting contacts:', error);
      toast.showError('Failed to access contacts');
    }
  };

  if (!isSupported) {
    return (
      <div className="text-white/60 text-sm">
        Contact import is not supported in your browser.
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleSelectContacts}
        className="w-full bg-[#242538] text-white/80 rounded-xl p-4 hover:bg-[#2a2b42] transition-colors flex items-center justify-center gap-2"
      >
        <Phone className="w-5 h-5" />
        Select Contacts to Invite
      </button>

      {contacts.length > 0 && (
        <div className="mt-4 space-y-2">
          {contacts.map((contact, index) => (
            <div
              key={index}
              className="bg-[#242538] rounded-xl p-3 hover:bg-[#2a2b42] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2a2b42] flex items-center justify-center text-[#CCFF00] font-medium">
                    {contact.name[0]?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{contact.name[0]}</p>
                    {contact.email && contact.email[0] && (
                      <p className="text-white/60 text-sm">{contact.email[0]}</p>
                    )}
                  </div>
                </div>
                <button
                  className="bg-[#CCFF00] text-black px-4 py-1.5 rounded-full text-sm font-medium hover:bg-opacity-90 transition-colors"
                >
                  Invite
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

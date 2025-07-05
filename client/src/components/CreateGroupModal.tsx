import React, { useState } from 'react';
import { X, Upload, Shield, Globe, Users } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import LoadingOverlay from './LoadingOverlay';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GroupType = 'public' | 'private';
type GroupCategory = 'Sports' | 'Music' | 'Politics' | 'Gaming' | 'Entertainment' | 'Other';

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [groupType, setGroupType] = useState<GroupType>('public');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GroupCategory>('Sports');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [rules, setRules] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = '';
      if (avatar) {
        const { data, error } = await supabase.storage
          .from('group-avatars')
          .upload(`${Date.now()}-${avatar.name}`, avatar, {
            onUploadProgress: (progress) => {
              setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
            }
          });

        if (error) throw error;
        avatarUrl = data.path;
      }

      // Create group logic here
      console.log({
        groupType,
        name,
        category,
        description,
        avatarUrl,
        rules
      });

      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      {loading && (
        <LoadingOverlay 
          message={uploadProgress > 0 
            ? `Uploading avatar... ${uploadProgress}%` 
            : "Creating group..."
          } 
        />
      )}

      <div className="bg-[#242538] rounded-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Create New Group</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {step === 1 ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Group Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setGroupType('public')}
                      disabled={loading}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                        groupType === 'public'
                          ? 'border-[#CCFF00] bg-[#CCFF00]/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
                        <Globe className={`w-6 h-6 ${groupType === 'public' ? 'text-[#CCFF00]' : 'text-white'}`} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-white">Public Group</h3>
                        <p className="text-sm text-white/60">Anyone can join without approval</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupType('private')}
                      disabled={loading}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                        groupType === 'private'
                          ? 'border-[#CCFF00] bg-[#CCFF00]/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
                        <Shield className={`w-6 h-6 ${groupType === 'private' ? 'text-[#CCFF00]' : 'text-white'}`} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-white">Private Group</h3>
                        <p className="text-sm text-white/60">Requires approval to join</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1a1b2e] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
                    placeholder="Enter group name"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-400 mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GroupCategory)}
                    className="w-full bg-[#1a1b2e] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
                    required
                    disabled={loading}
                  >
                    <option value="Sports">Sports</option>
                    <option value="Music">Music</option>
                    <option value="Politics">Politics</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#1a1b2e] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
                    placeholder="Describe your group"
                    rows={3}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Group Avatar
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Group avatar preview"
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-[#1a1b2e] flex items-center justify-center">
                          <Users className="w-8 h-8 text-white/60" />
                        </div>
                      )}
                      <input
                        type="file"
                        id="avatar"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        disabled={loading}
                      />
                      <label
                        htmlFor="avatar"
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Upload className="w-6 h-6 text-white" />
                      </label>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">Upload Group Avatar</p>
                      <p className="text-sm text-white/60">
                        Recommended size: 500x500px. Max file size: 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="rules" className="block text-sm font-medium text-gray-400 mb-2">
                    Group Rules (Optional)
                  </label>
                  <textarea
                    id="rules"
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    className="w-full bg-[#1a1b2e] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
                    placeholder="Set rules for your group members"
                    rows={5}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-2 rounded-xl font-medium text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="px-6 py-2 rounded-xl font-medium bg-[#CCFF00] text-black hover:bg-[#b3ff00] transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="px-6 py-2 rounded-xl font-medium text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl font-medium bg-[#CCFF00] text-black hover:bg-[#b3ff00] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" color="#000000" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create Group'
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
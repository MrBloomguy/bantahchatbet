import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { privyDIDtoUUID } from '../utils/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingOverlay from '../components/LoadingOverlay';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';

const ProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    avatar_url: ''
  });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        username: currentUser.username || '',
        bio: currentUser.bio || '',
        avatar_url: currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`
      });
      setInitialized(true);
    }
  }, [currentUser]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      setImageLoading(true);
      const userId = privyDIDtoUUID(currentUser.id);
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      await refreshUser();
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.showError('Failed to upload image');
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      const userId = privyDIDtoUUID(currentUser.id);

      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name.trim(),
          username: formData.username.trim().toLowerCase(),
          bio: formData.bio.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      await refreshUser();
      navigate(-1);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.showError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!initialized || !currentUser) {
    return (
      <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {loading && <LoadingOverlay message="Saving changes..." />}

      <PageHeader title="Edit Profile" />

      <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-2">
          <label className="block text-sm font-medium text-gray-600 mb-2 text-center">
            Profile Photo
          </label>
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={formData.avatar_url}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border border-gray-200"
              />
              {/* Edit icon positioned directly on the edge of the avatar */}
              <label className="absolute bottom-0 right-0 p-1.5 bg-[#CCFF00] rounded-full cursor-pointer hover:bg-[#b3ff00] transition-colors shadow-sm border border-white">
                {imageLoading ? (
                  <LoadingSpinner size="sm" color="#000000" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-black" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={imageLoading || loading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-gray-900 placeholder-gray-400"
            placeholder="Your name"
            disabled={loading}
            maxLength={50}
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Username
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-gray-900 placeholder-gray-400"
            placeholder="@username"
            disabled={loading}
            maxLength={30}
            pattern="[a-zA-Z0-9_]+"
            title="Username can only contain letters, numbers, and underscores"
          />
          <p className="mt-1 text-sm text-gray-500">
            Only letters, numbers, and underscores allowed
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-gray-900 placeholder-gray-400 min-h-[80px]"
            placeholder="Tell us about yourself"
            rows={3}
            disabled={loading}
            maxLength={160}
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.bio.length}/160 characters
          </p>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Email
          </label>
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>
              {typeof currentUser.email === 'string'
                ? currentUser.email
                : currentUser.email?.address || 'No email set'}
            </span>
          </div>
        </div>

        {/* Password Change Link */}
        <button
          type="button"
          disabled={loading}
          className="flex items-center gap-2 text-[#7440ff] hover:text-[#5930cc] text-sm font-medium disabled:opacity-50"
        >
          <Lock className="w-4 h-4" />
          <span>Change Password</span>
        </button>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-[#7440ff] text-white rounded-lg font-medium hover:bg-[#5930cc] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" color="#ffffff" />
              <span>Saving...</span>
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </form>
    </div>
  );
};

export default ProfileSettings;

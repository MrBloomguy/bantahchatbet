import { useState, useEffect } from 'react';
import { Plus, Edit, Trash } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import { useToast } from '../contexts/ToastContext';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

interface Story {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
  admin_id: string;
  admin?: {
    name: string;
    avatar_url: string;
  };
}

const AdminStories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: null as File | null
  });

  const { getStories, createStory, updateStory, deleteStory } = useAdmin();
  const toast = useToast();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const data = await getStories();
      setStories(data);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.showError('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      let imageUrl = selectedStory?.image_url;

      if (formData.image) {
        try {
          // Generate a unique filename
          const fileExt = formData.image.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

          // Try to upload the image
          const { error: uploadError } = await supabase.storage
            .from('story-images')
            .upload(fileName, formData.image, {
              cacheControl: '3600',
              upsert: true // Use upsert to overwrite if file exists
            });

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            toast.showError(`Image upload failed: ${uploadError.message}`);
            // Continue without the image
          } else {
            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
              .from('story-images')
              .getPublicUrl(fileName);

            imageUrl = publicUrl;
          }
        } catch (imageError) {
          console.error('Error processing image:', imageError);
          toast.showError('Failed to process image, but will continue with story creation');
          // Continue without the image
        }
      }

      // Continue with story creation/update
      if (selectedStory) {
        await updateStory(selectedStory.id, {
          title: formData.title,
          content: formData.content,
          image_url: imageUrl
        });
        toast.showSuccess('Story updated successfully');
      } else {
        await createStory({
          title: formData.title,
          content: formData.content,
          image_url: imageUrl
        });
        toast.showSuccess('Story created successfully');
      }

      setFormData({ title: '', content: '', image: null });
      setSelectedStory(null);
      setShowForm(false);
      fetchStories();
    } catch (error) {
      console.error('Error saving story:', error);
      toast.showError(error instanceof Error ? error.message : 'Failed to save story');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (story: Story) => {
    setSelectedStory(story);
    setFormData({
      title: story.title,
      content: story.content,
      image: null
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
      setLoading(true);
      await deleteStory(id);
      toast.showSuccess('Story deleted successfully');
      fetchStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.showError('Failed to delete story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPageLayout
        title="Stories"
        actions={
          <button
            type="button"
            onClick={() => {
              setSelectedStory(null);
              setFormData({ title: '', content: '', image: null });
              setShowForm(true);
            }}
            className="px-4 py-2 bg-[#CCFF00] text-black rounded-lg font-medium hover:bg-[#CCFF00]/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Story
          </button>
        }
      >

        {showForm && (
          <div className="bg-[#242538] rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {selectedStory ? 'Edit Story' : 'Create Story'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="story-title" className="block text-sm font-medium text-gray-400 mb-1">
                  Title
                </label>
                <input
                  id="story-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1b2e] text-white rounded-lg"
                  placeholder="Enter story title"
                  required
                />
              </div>

              <div>
                <label htmlFor="story-content" className="block text-sm font-medium text-gray-400 mb-1">
                  Content
                </label>
                <textarea
                  id="story-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1b2e] text-white rounded-lg"
                  placeholder="Enter story content"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label htmlFor="story-image" className="block text-sm font-medium text-gray-400 mb-1">
                  Image
                </label>
                <input
                  id="story-image"
                  type="file"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                  accept="image/*"
                  title="Select an image for the story"
                  className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-medium
                    file:bg-[#CCFF00] file:text-black
                    hover:file:bg-[#CCFF00]/90"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-white rounded-lg hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#CCFF00] text-black rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Saving...' : selectedStory ? 'Update Story' : 'Create Story'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-[#242538] rounded-xl p-4 flex flex-col sm:flex-row items-start gap-4"
              >
                <div className="flex items-start gap-4 flex-1 w-full">
                  {story.image_url && (
                    <img
                      src={story.image_url}
                      alt={story.title}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0 hidden sm:block"
                    />
                  )}
                  <div className="flex-1">
                    {story.image_url && (
                      <img
                        src={story.image_url}
                        alt={story.title}
                        className="w-full h-32 rounded-lg object-cover mb-3 sm:hidden"
                      />
                    )}
                    <h3 className="text-lg font-medium text-white">{story.title}</h3>
                    <p className="text-white/60 mt-1 line-clamp-2">{story.content}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <p className="text-sm text-white/40">
                        By {story.admin?.name}
                      </p>
                      <p className="text-sm text-white/40">
                        {new Date(story.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-3 sm:hidden">
                      <button
                        type="button"
                        onClick={() => handleEdit(story)}
                        className="px-3 py-1.5 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(story.id)}
                        className="px-3 py-1.5 text-sm bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 flex items-center gap-1"
                      >
                        <Trash className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(story)}
                    className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10"
                    aria-label="Edit story"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(story.id)}
                    className="p-2 text-white/60 hover:text-red-500 rounded-lg hover:bg-white/10"
                    aria-label="Delete story"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {stories.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-white/60">No stories found</p>
              </div>
            )}
          </div>
        )}
      </AdminPageLayout>
    </AdminLayout>
  );
};

export default AdminStories;
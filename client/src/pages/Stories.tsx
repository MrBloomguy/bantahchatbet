import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';
import MobileFooterNav from '../components/MobileFooterNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../contexts/ToastContext';

interface Story {
  id: string;
  title: string;
  content: string;
  created_at: string;
  admin_id: string;
  admin?: {
    id?: string;
    name: string;
    avatar_url?: string | null;
  };
  image_url?: string;
}

const Stories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchStories();

    // Subscribe to real-time changes
    const storiesSubscription = supabase
      .channel('stories-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stories'
      }, () => {
        fetchStories();
      })
      .subscribe();

    return () => {
      storiesSubscription.unsubscribe();
    };
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      // Simplified query to avoid join issues
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get admin profiles in a separate query
      if (data && data.length > 0) {
        // Get unique admin IDs
        const adminIds = [...new Set(data.map(story => story.admin_id))];

        // Fetch admin profiles from users table instead of profiles
        const { data: adminProfiles, error: profilesError } = await supabase
          .from('users')
          .select('id, username, avatar_url')
          .in('id', adminIds);

        if (profilesError) {
          console.error('Error fetching admin profiles:', profilesError);
        }

        // Create a map of admin profiles by ID
        const adminMap = (adminProfiles || []).reduce((map, profile) => {
          map[profile.id] = {
            id: profile.id,
            name: profile.username || 'Admin', // Use username as name
            avatar_url: profile.avatar_url
          };
          return map;
        }, {});

        // Add admin info to stories
        const storiesWithAdmins = data.map(story => ({
          ...story,
          admin: adminMap[story.admin_id] || { name: 'Unknown Admin', username: 'admin', avatar_url: null }
        }));

        setStories(storiesWithAdmins);
      } else {
        setStories([]);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.showError('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col pb-16">
      <PageHeader title="Stories" />
      <div className="flex-1 flex flex-col items-center w-full">
        <div className="w-full max-w-2xl mx-auto px-4 py-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No stories available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="bg-white rounded-xl shadow-sm p-4 transition-all duration-200 hover:shadow-md"
                >
                  {story.image_url && (
                    <img
                      src={story.image_url}
                      alt={story.title}
                      className="w-full h-48 sm:h-56 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{story.title}</h3>
                  <p className="text-gray-600 mb-4">{story.content}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={story.admin?.avatar_url || '/avatar.svg'}
                        alt={story.admin?.name || 'Admin'}
                        className="w-6 h-6 rounded-full"
                      />
                      <span>{story.admin?.name || 'Unknown Admin'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(story.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <MobileFooterNav />
    </div>
  );
};

export default Stories;
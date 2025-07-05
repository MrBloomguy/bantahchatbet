import { Event } from '../hooks/useEvent';

interface OpenGraphData {
  title: string;
  description: string;
  image: string;
  url: string;
}

export const generateEventOGData = (event: Event): OpenGraphData => {
  const baseUrl = window.location.origin;
  
  return {
    title: `${event.title} - Bantah Challenge`,
    description: `Join this ${event.category} event with a prize pool of ₦${event.pool?.total_amount ? event.pool.total_amount.toLocaleString() : '0'}! Created by @${event.creator?.username || 'unknown'}`,
    image: event.banner_url || `${baseUrl}/images/default-banner.jpg`,
    url: `${baseUrl}/events/${event.id}`
  };
};

export const generateChallengeOGData = (challenge: any): OpenGraphData => {
  const baseUrl = window.location.origin;
  
  return {
    title: `${challenge.title} - P2P Challenge`,
    description: `${challenge.challenger.name} challenges you to a ${challenge.type} match for ₦${challenge.amount.toLocaleString()}!`,
    image: challenge.banner_url || `${baseUrl}/images/default-challenge.jpg`,
    url: `${baseUrl}/challenge/${challenge.id}`
  };
};

export const generateSocialChallengeOGData = (data: {
  title: string;
  amount: number;
  challenger: string;
  platform: string;
}): OpenGraphData => {
  const baseUrl = window.location.origin;
  
  return {
    title: `${data.title} - Social Challenge`,
    description: `@${data.challenger} challenges you to a ${data.title} match for ₦${data.amount.toLocaleString()}! Accept the challenge on Bantah.`,
    image: `${baseUrl}/images/social-challenge.jpg`,
    url: `${baseUrl}/challenge?ref=${data.challenger}&platform=${data.platform}`
  };
};

export const updateMetaTags = (data: OpenGraphData) => {
  // Update OpenGraph tags
  const ogTags = {
    'og:title': data.title,
    'og:description': data.description,
    'og:image': data.image,
    'og:url': data.url,
    'twitter:title': data.title,
    'twitter:description': data.description,
    'twitter:image': data.image
  };

  Object.entries(ogTags).forEach(([property, content]) => {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  });
};
import { API_BASE_URL } from '../services/ApiService';

export function getAvatarUrl(avatar_url?: string, cacheBustKey?: number) {
  if (!avatar_url) return 'https://picsum.photos/200/300';
  let url = avatar_url.startsWith('http')
    ? avatar_url
    : API_BASE_URL + avatar_url;
  if (cacheBustKey) {
    url += (url.includes('?') ? '&' : '?') + 't=' + cacheBustKey;
  }
  return url;
} 
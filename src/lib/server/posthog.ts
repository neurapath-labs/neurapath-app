import posthog, { PostHog } from 'posthog-node';
import { env } from '$env/dynamic/public';

let _client: PostHog | null = null;

export function getPostHogClient(): PostHog | null {
  if (!env.PUBLIC_POSTHOG_KEY) {
    return null;
  }

  if (!_client) {
    _client = new posthog.PostHog(env.PUBLIC_POSTHOG_KEY, {
      host: env.PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    });
  }
  return _client;
}

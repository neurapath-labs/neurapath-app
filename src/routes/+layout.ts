import posthog from 'posthog-js';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

export const load = async () => {
  if (browser && env.PUBLIC_POSTHOG_KEY) {
    posthog.init(env.PUBLIC_POSTHOG_KEY, {
      api_host: env.PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      capture_exceptions: true, // This enables capturing exceptions using Error Tracking, set to false if you don't want this
    });
  }
};

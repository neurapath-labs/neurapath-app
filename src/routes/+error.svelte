<script lang="ts">
  import SeoHead from '$lib/components/SeoHead.svelte';
  import { page } from '$app/stores';
</script>

<SeoHead
  title="Page Not Found - Neurapath Learning Platform"
  description="The page you're looking for doesn't exist on Neurapath's evidence-based learning platform."
  keywords="404, page not found, learning platform error"
  ogTitle="Page Not Found - Neurapath Learning Platform"
  ogDescription="The page you're looking for doesn't exist on Neurapath's evidence-based learning platform."
  twitterTitle="Page Not Found - Neurapath Learning Platform"
  twitterDescription="The page you're looking for doesn't exist on Neurapath's evidence-based learning platform."
  canonicalUrl="https://neurapath.shop/404"
/>

<div class="error-page">
  <div class="error-content">
    <h1>404 - Page Not Found</h1>
    <p>Sorry, the page you're looking for doesn't exist or has been moved.</p>
    
    <div class="error-actions">
      <a href="/" class="primary-button">Go to Homepage</a>
      <a href="/features" class="secondary-button">Explore Features</a>
    </div>
    
    <div class="error-image">
      <!-- This would be replaced with an actual illustration -->
      <div class="placeholder-image">📚</div>
    </div>
    
    <p class="error-help">
      If you believe this is an error, please <a href="mailto:support@neurapath.shop">contact our support team</a>.
    </p>
  </div>
</div>

<style>
  .error-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    background: rgb(var(--background));
  }

  .error-content {
    text-align: center;
    max-width: 600px;
    background: rgb(var(--card));
    border: 1px solid rgb(var(--border));
    border-radius: var(--radius);
    padding: 3rem 2rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }

  .error-content h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: rgb(var(--font-color));
  }

  .error-content p {
    font-size: 1.2rem;
    color: rgb(var(--muted-foreground));
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .primary-button,
  .secondary-button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius);
    text-decoration: none;
    font-weight: bold;
    transition: all 0.3s ease;
  }

  .primary-button {
    background: rgb(var(--primary));
    color: rgb(var(--primary-foreground));
  }

  .primary-button:hover {
    background: rgb(var(--primary-foreground));
    color: rgb(var(--primary));
  }

  .secondary-button {
    background: rgb(var(--secondary));
    color: rgb(var(--secondary-foreground));
    border: 1px solid rgb(var(--border));
  }

  .secondary-button:hover {
    background: rgb(var(--accent));
    color: rgb(var(--accent-foreground));
  }

  .error-image {
    margin: 2rem 0;
  }

  .placeholder-image {
    font-size: 4rem;
    opacity: 0.7;
  }

  .error-help {
    margin-top: 2rem;
    font-size: 0.9rem;
  }

  .error-help a {
    color: rgb(var(--primary));
    text-decoration: none;
  }

  .error-help a:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .error-content {
      padding: 2rem 1rem;
    }

    .error-content h1 {
      font-size: 2rem;
    }

    .error-actions {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>
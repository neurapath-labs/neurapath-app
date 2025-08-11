<script lang="ts">
  import SeoHead from '$lib/components/SeoHead.svelte';
</script>

<SeoHead
  title="Neurapath Features - Evidence-Based Learning Tools"
  description="Discover Neurapath's powerful evidence-based learning features including spaced repetition, incremental reading, and active recall techniques."
  keywords="spaced repetition, incremental reading, active recall, learning features, educational tools"
  ogTitle="Neurapath Features - Evidence-Based Learning Tools"
  ogDescription="Discover Neurapath's powerful evidence-based learning features including spaced repetition, incremental reading, and active recall techniques."
  twitterTitle="Neurapath Features - Evidence-Based Learning Tools"
  twitterDescription="Discover Neurapath's powerful evidence-based learning features including spaced repetition, incremental reading, and active recall techniques."
  canonicalUrl="https://neurapath.shop/features"
  schema={[{
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Evidence-Based Learning Techniques",
    "description": "Master learning techniques based on cognitive science research including spaced repetition, incremental reading, and active recall",
    "provider": {
      "@type": "Organization",
      "name": "Neurapath"
    }
  }]}
/>

<div class="features-page">
  <header>
    <h1>Neurapath Features</h1>
    <p>Powerful evidence-based learning tools designed to optimize your study sessions</p>
  </header>

  <section class="features-grid">
    <div class="feature-card">
      <h2>Spaced Repetition</h2>
      <p>Implement the proven SM-2 algorithm to optimize your review schedule and maximize long-term retention.</p>
    </div>

    <div class="feature-card">
      <h2>Incremental Reading</h2>
      <p>Process large texts efficiently by extracting key information and creating flashcards on the fly.</p>
    </div>

    <div class="feature-card">
      <h2>Cloze Deletions</h2>
      <p>Create powerful flashcards by hiding parts of text to test your recall and understanding.</p>
    </div>

    <div class="feature-card">
      <h2>Image Occlusions</h2>
      <p>Transform images into interactive learning tools by hiding parts to test visual memory.</p>
    </div>

    <div class="feature-card">
      <h2>Active Recall</h2>
      <p>Strengthen memory retention through testing and self-quizzing techniques.</p>
    </div>

    <div class="feature-card">
      <h2>Progress Tracking</h2>
      <p>Monitor your learning progress with detailed statistics and performance analytics.</p>
    </div>
  </section>

  <section class="cta-section">
    <h2>Ready to Transform Your Learning?</h2>
    <p>Join thousands of students and professionals who have improved their learning outcomes with Neurapath.</p>
    <a href="/login" class="cta-button">Get Started Free</a>
  </section>
</div>

<style>
  .features-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    text-align: center;
    margin-bottom: 3rem;
  }

  header h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: rgb(var(--font-color));
  }

  header p {
    font-size: 1.2rem;
    color: rgb(var(--muted-foreground));
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .feature-card {
    background: rgb(var(--card));
    border: 1px solid rgb(var(--border));
    border-radius: var(--radius);
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .feature-card h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: rgb(var(--font-color));
  }

  .feature-card p {
    color: rgb(var(--muted-foreground));
    line-height: 1.6;
  }

  .cta-section {
    text-align: center;
    padding: 3rem 2rem;
    background: rgb(var(--secondary));
    border-radius: var(--radius);
  }

  .cta-section h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: rgb(var(--font-color));
  }

  .cta-section p {
    font-size: 1.1rem;
    margin-bottom: 2rem;
    color: rgb(var(--muted-foreground));
  }

  .cta-button {
    display: inline-block;
    background: rgb(var(--primary));
    color: rgb(var(--primary-foreground));
    padding: 1rem 2rem;
    border-radius: var(--radius);
    text-decoration: none;
    font-weight: bold;
    font-size: 1.1rem;
    transition: background 0.3s ease;
  }

  .cta-button:hover {
    background: rgb(var(--primary-foreground));
    color: rgb(var(--primary));
  }

  @media (max-width: 768px) {
    .features-page {
      padding: 1rem;
    }

    header h1 {
      font-size: 2rem;
    }

    .features-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
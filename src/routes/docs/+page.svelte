<script lang="ts">
  import SeoHead from '$lib/components/SeoHead.svelte';
</script>

<SeoHead
  title="Neurapath Documentation - Learning Platform Guide"
  description="Complete documentation for Neurapath's evidence-based learning platform. Learn how to use spaced repetition, incremental reading, and other powerful study techniques."
  keywords="learning platform documentation, spaced repetition guide, incremental reading tutorial, study techniques"
  ogTitle="Neurapath Documentation - Learning Platform Guide"
  ogDescription="Complete documentation for Neurapath's evidence-based learning platform. Learn how to use spaced repetition, incremental reading, and other powerful study techniques."
  twitterTitle="Neurapath Documentation - Learning Platform Guide"
  twitterDescription="Complete documentation for Neurapath's evidence-based learning platform. Learn how to use spaced repetition, incremental reading, and other powerful study techniques."
  canonicalUrl="https://neurapath.shop/docs"
  schema={[{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Neurapath Documentation",
    "description": "Complete guide to using evidence-based learning techniques",
    "author": {
      "@type": "Organization",
      "name": "Neurapath"
    }
  }]}
/>

<div class="docs-page">
  <header>
    <h1>Neurapath Documentation</h1>
    <p>Learn how to maximize your learning with evidence-based techniques</p>
  </header>

  <nav class="docs-nav">
    <ul>
      <li><a href="#getting-started">Getting Started</a></li>
      <li><a href="#spaced-repetition">Spaced Repetition</a></li>
      <li><a href="#incremental-reading">Incremental Reading</a></li>
      <li><a href="#cloze-deletions">Cloze Deletions</a></li>
      <li><a href="#image-occlusions">Image Occlusions</a></li>
      <li><a href="#best-practices">Best Practices</a></li>
    </ul>
  </nav>

  <main class="docs-content">
    <section id="getting-started">
      <h2>Getting Started</h2>
      <p>Welcome to Neurapath! This guide will help you understand how to use our evidence-based learning platform effectively.</p>
      <p>Neurapath combines proven learning techniques like spaced repetition, incremental reading, and active recall to help you study smarter, not harder.</p>
    </section>

    <section id="spaced-repetition">
      <h2>Spaced Repetition</h2>
      <p>Spaced repetition is a learning technique that increases intervals between review sessions as knowledge becomes more firmly established.</p>
      <h3>How it works:</h3>
      <ul>
        <li>Create flashcards with key information</li>
        <li>Review cards at increasing intervals</li>
        <li>Rate your recall after each review</li>
        <li>The system adjusts intervals based on your performance</li>
      </ul>
    </section>

    <section id="incremental-reading">
      <h2>Incremental Reading</h2>
      <p>Incremental reading allows you to process large texts efficiently by extracting key information and creating learning items on the fly.</p>
      <h3>Key benefits:</h3>
      <ul>
        <li>Process multiple articles simultaneously</li>
        <li>Extract key points as you read</li>
        <li>Create flashcards from text selections</li>
        <li>Maintain context while learning</li>
      </ul>
    </section>

    <section id="cloze-deletions">
      <h2>Cloze Deletions</h2>
      <p>Cloze deletions involve hiding parts of text to test recall and understanding.</p>
      <h3>How to create effective cloze deletions:</h3>
      <ul>
        <li>Focus on key concepts or facts</li>
        <li>Keep deletions concise and clear</li>
        <li>Avoid ambiguous answers</li>
        <li>Use meaningful context</li>
      </ul>
    </section>

    <section id="image-occlusions">
      <h2>Image Occlusions</h2>
      <p>Transform images into interactive learning tools by hiding parts to test visual memory.</p>
      <h3>Best practices:</h3>
      <ul>
        <li>Use high-quality, clear images</li>
        <li>Focus on key visual elements</li>
        <li>Make occlusions meaningful and unambiguous</li>
        <li>Combine with text explanations when helpful</li>
      </ul>
    </section>

    <section id="best-practices">
      <h2>Best Practices</h2>
      <h3>For Effective Learning:</h3>
      <ul>
        <li>Review items regularly according to the schedule</li>
        <li>Create high-quality learning items</li>
        <li>Organize content in logical folders</li>
        <li>Track your progress and adjust strategies</li>
        <li>Stay consistent with daily practice</li>
      </ul>
    </section>
  </main>
</div>

<style>
  .docs-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 2rem;
  }

  header {
    grid-column: 1 / -1;
    text-align: center;
    margin-bottom: 2rem;
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

  .docs-nav {
    background: rgb(var(--card));
    border: 1px solid rgb(var(--border));
    border-radius: var(--radius);
    padding: 1.5rem;
    align-self: start;
    position: sticky;
    top: 2rem;
  }

  .docs-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .docs-nav li {
    margin-bottom: 0.5rem;
  }

  .docs-nav a {
    text-decoration: none;
    color: rgb(var(--muted-foreground));
    display: block;
    padding: 0.5rem;
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
  }

  .docs-nav a:hover,
  .docs-nav a:focus {
    background: rgb(var(--secondary));
    color: rgb(var(--font-color));
  }

  .docs-content {
    background: rgb(var(--card));
    border: 1px solid rgb(var(--border));
    border-radius: var(--radius);
    padding: 2rem;
  }

  .docs-content section {
    margin-bottom: 2rem;
  }

  .docs-content h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: rgb(var(--font-color));
    border-bottom: 2px solid rgb(var(--border));
    padding-bottom: 0.5rem;
  }

  .docs-content h3 {
    font-size: 1.4rem;
    margin: 1.5rem 0 1rem 0;
    color: rgb(var(--font-color));
  }

  .docs-content p {
    color: rgb(var(--muted-foreground));
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  .docs-content ul {
    color: rgb(var(--muted-foreground));
    line-height: 1.6;
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }

  .docs-content li {
    margin-bottom: 0.5rem;
  }

  @media (max-width: 768px) {
    .docs-page {
      grid-template-columns: 1fr;
      padding: 1rem;
    }

    .docs-nav {
      position: static;
      margin-bottom: 2rem;
    }

    header h1 {
      font-size: 2rem;
    }
  }
</style>
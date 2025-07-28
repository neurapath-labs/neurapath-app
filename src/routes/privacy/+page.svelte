<script lang="ts">
  import SeoHead from '$lib/components/SeoHead.svelte';
</script>

<SeoHead
  title="Privacy Policy - Neurapath Learning Platform"
  description="Learn how Neurapath protects your privacy and handles your personal data in our evidence-based learning platform."
  keywords="privacy policy, data protection, learning platform privacy, user data"
  ogTitle="Privacy Policy - Neurapath Learning Platform"
  ogDescription="Learn how Neurapath protects your privacy and handles your personal data in our evidence-based learning platform."
  twitterTitle="Privacy Policy - Neurapath Learning Platform"
  twitterDescription="Learn how Neurapath protects your privacy and handles your personal data in our evidence-based learning platform."
  canonicalUrl="https://neurapath.io/privacy"
/>

<div class="privacy-page">
  <header>
    <h1>Privacy Policy</h1>
    <p>Effective Date: July 26, 2025</p>
  </header>

  <main class="privacy-content">
    <section>
      <h2>Introduction</h2>
      <p>Neurapath ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our evidence-based learning platform.</p>
    </section>

    <section>
      <h2>Information We Collect</h2>
      <h3>Personal Information</h3>
      <ul>
        <li>Username and email address (if provided)</li>
        <li>Account creation and login information</li>
      </ul>
      
      <h3>Usage Data</h3>
      <ul>
        <li>Learning progress and statistics</li>
        <li>Study session data</li>
        <li>Feature usage patterns</li>
        <li>Device and browser information</li>
      </ul>
      
      <h3>Content Data</h3>
      <ul>
        <li>Your learning materials and flashcards</li>
        <li>Study notes and annotations</li>
        <li>Performance metrics and review history</li>
      </ul>
    </section>

    <section>
      <h2>How We Use Your Information</h2>
      <ul>
        <li>To provide and maintain our learning platform</li>
        <li>To personalize your learning experience</li>
        <li>To improve our services and features</li>
        <li>To analyze usage patterns and optimize performance</li>
        <li>To communicate with you about updates and features</li>
        <li>To protect the security and integrity of our platform</li>
      </ul>
    </section>

    <section>
      <h2>Data Storage and Security</h2>
      <p>Your data is stored securely using industry-standard encryption and security practices. We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.</p>
      <p>All data transmission is encrypted using HTTPS, and sensitive information is stored using secure hashing algorithms.</p>
    </section>

    <section>
      <h2>Data Sharing</h2>
      <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
      <ul>
        <li>With your explicit consent</li>
        <li>To comply with legal obligations</li>
        <li>To protect our rights and property</li>
        <li>To prevent fraud or abuse</li>
      </ul>
    </section>

    <section>
      <h2>Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal information</li>
        <li>Correct inaccurate information</li>
        <li>Delete your account and data</li>
        <li>Object to processing of your data</li>
        <li>Data portability (export your data)</li>
      </ul>
    </section>

    <section>
      <h2>Data Retention</h2>
      <p>We retain your personal information for as long as your account is active or as needed to provide you services. When you delete your account, we will delete your personal information within 30 days, except where retention is required for legal or business purposes.</p>
    </section>

    <section>
      <h2>Children's Privacy</h2>
      <p>Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.</p>
    </section>

    <section>
      <h2>Changes to This Privacy Policy</h2>
      <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the effective date.</p>
    </section>

    <section>
      <h2>Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us:</p>
      <ul>
        <li>Email: privacy@neurapath.io</li>
        <li>Website: https://neurapath.io</li>
      </ul>
    </section>
  </main>
</div>

<style>
  .privacy-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    text-align: center;
    margin-bottom: 3rem;
    border-bottom: 2px solid rgb(var(--border));
    padding-bottom: 2rem;
  }

  header h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: rgb(var(--font-color));
  }

  header p {
    font-size: 1.1rem;
    color: rgb(var(--muted-foreground));
  }

  .privacy-content {
    background: rgb(var(--card));
    border: 1px solid rgb(var(--border));
    border-radius: var(--radius);
    padding: 2rem;
  }

  .privacy-content section {
    margin-bottom: 2rem;
  }

  .privacy-content h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: rgb(var(--font-color));
  }

  .privacy-content h3 {
    font-size: 1.4rem;
    margin: 1.5rem 0 1rem 0;
    color: rgb(var(--font-color));
  }

  .privacy-content p {
    color: rgb(var(--muted-foreground));
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  .privacy-content ul {
    color: rgb(var(--muted-foreground));
    line-height: 1.6;
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }

  .privacy-content li {
    margin-bottom: 0.5rem;
  }

  @media (max-width: 768px) {
    .privacy-page {
      padding: 1rem;
    }

    header h1 {
      font-size: 2rem;
    }
  }
</style>
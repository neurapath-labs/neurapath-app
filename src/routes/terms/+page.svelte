<script lang="ts">
  import SeoHead from '$lib/components/SeoHead.svelte';
</script>

<SeoHead
  title="Terms of Service - Neurapath Learning Platform"
  description="Terms and conditions for using Neurapath's evidence-based learning platform and services."
  keywords="terms of service, user agreement, learning platform terms, service conditions"
  ogTitle="Terms of Service - Neurapath Learning Platform"
  ogDescription="Terms and conditions for using Neurapath's evidence-based learning platform and services."
  twitterTitle="Terms of Service - Neurapath Learning Platform"
  twitterDescription="Terms and conditions for using Neurapath's evidence-based learning platform and services."
  canonicalUrl="https://neurapath.io/terms"
/>

<div class="terms-page">
  <header>
    <h1>Terms of Service</h1>
    <p>Effective Date: July 26, 2025</p>
  </header>

  <main class="terms-content">
    <section>
      <h2>Acceptance of Terms</h2>
      <p>By accessing or using the Neurapath learning platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.</p>
    </section>

    <section>
      <h2>Description of Service</h2>
      <p>Neurapath provides an evidence-based learning platform that implements proven techniques such as spaced repetition, incremental reading, and active recall to optimize learning outcomes. The Service is provided "as is" and may be modified or discontinued at any time.</p>
    </section>

    <section>
      <h2>Account Registration</h2>
      <p>When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
    </section>

    <section>
      <h2>User Content</h2>
      <p>You retain all rights to any content you upload, post, or display on or through the Service ("User Content"). By posting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, adapt, publish, translate, and distribute your User Content in any existing or future media.</p>
      <p>You represent and warrant that:</p>
      <ul>
        <li>You own or have the necessary licenses, rights, consents, and permissions to the User Content;</li>
        <li>The User Content does not infringe any third-party rights;</li>
        <li>The User Content complies with these Terms and applicable laws.</li>
      </ul>
    </section>

    <section>
      <h2>Prohibited Activities</h2>
      <p>You agree not to engage in any of the following prohibited activities:</p>
      <ul>
        <li>Using the Service for any illegal purpose or in violation of any laws;</li>
        <li>Interfering with or disrupting the Service or servers;</li>
        <li>Attempting to gain unauthorized access to the Service;</li>
        <li>Uploading or transmitting viruses or other malicious code;</li>
        <li>Harvesting or collecting email addresses or other contact information;</li>
        <li>Impersonating any person or entity;</li>
        <li>Violating any applicable laws or regulations.</li>
      </ul>
    </section>

    <section>
      <h2>Intellectual Property</h2>
      <p>The Service and its original content, features, and functionality are and will remain the exclusive property of Neurapath and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.</p>
    </section>

    <section>
      <h2>Disclaimer of Warranties</h2>
      <p>The Service is provided on an "as is" and "as available" basis. We disclaim all warranties, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
    </section>

    <section>
      <h2>Limitation of Liability</h2>
      <p>In no event shall Neurapath, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:</p>
      <ul>
        <li>Your access to or use of or inability to access or use the Service;</li>
        <li>Any conduct or content of any third party on the Service;</li>
        <li>Any content obtained from the Service;</li>
        <li>Unauthorized access, use or alteration of your transmissions or content.</li>
      </ul>
    </section>

    <section>
      <h2>Termination</h2>
      <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
      <p>Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.</p>
    </section>

    <section>
      <h2>Changes to Terms</h2>
      <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any significant changes by posting the new Terms on this page and updating the effective date.</p>
      <p>Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.</p>
    </section>

    <section>
      <h2>Governing Law</h2>
      <p>These Terms shall be governed and construed in accordance with the laws of Sweden, without regard to its conflict of law provisions.</p>
    </section>

    <section>
      <h2>Contact Us</h2>
      <p>If you have any questions about these Terms, please contact us:</p>
      <ul>
        <li>Email: legal@neurapath.io</li>
        <li>Website: https://neurapath.io</li>
      </ul>
    </section>
  </main>
</div>

<style>
  .terms-page {
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

  .terms-content {
    background: rgb(var(--card));
    border: 1px solid rgb(var(--border));
    border-radius: var(--radius);
    padding: 2rem;
  }

  .terms-content section {
    margin-bottom: 2rem;
  }

  .terms-content h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: rgb(var(--font-color));
  }

  .terms-content p {
    color: rgb(var(--muted-foreground));
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  .terms-content ul {
    color: rgb(var(--muted-foreground));
    line-height: 1.6;
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }

  .terms-content li {
    margin-bottom: 0.5rem;
  }

  @media (max-width: 768px) {
    .terms-page {
      padding: 1rem;
    }

    header h1 {
      font-size: 2rem;
    }
  }
</style>
<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';

  export let form: { error?: string } | undefined;

  let username = '';
  let password = '';
</script>

<div class="visible modalbox">
  <form method="POST" action="?/login">
    <div class="modalbox-header">
      <img class="modalbox-icon" src="/img/logo.svg" alt="Neurapath logo" />
      <span class="modalbox-title">Neuraa</span>
    </div>

    <div class="modalbox-content">
      Welcome aboard! Neuraa is specifically tailored for effective studying.
      <u>New user:</u> enter a username and password then press login to create a new account.
      <u>Existing user:</u> enter your username and password below.
    </div>

    {#if form?.error}
      <p class="error" role="alert">{form.error}</p>
    {/if}

    <Input
      id="modalbox-login-username"
      name="username"
      placeholder="Username..."
      bind:value={username}
      required
      autocomplete="username"
    />

    <Input
      id="modalbox-login-password"
      name="password"
      type="password"
      placeholder="Password..."
      bind:value={password}
      required
      autocomplete="current-password"
    />

    <Button id="modalbox-login-button" type="submit">Login!</Button>

    <div class="modalbox-footer">
      <a href="/register">Create new account</a>
    </div>
  </form>
</div>

<style>
  .modalbox {
    position: absolute;
    overflow: auto;
    background-color: rgb(var(--background-color_modalbox));
    color: rgb(var(--font-color));
    width: 400px;
    height: 400px;
    max-height: 600px;
    left: 50%;
    top: 50%;
    margin-left: -200px;
    margin-top: -400px;
    display: grid;
    padding: 32px;
    border: 1px solid rgb(var(--background-color));
    border-radius: 4px;
    z-index: 10;
  }
  .modalbox-header {
    font-size: 26px;
    margin-bottom: 20px;
    display: grid;
    grid-template-columns: min-content;
    grid-template-rows: min-content min-content;
    text-align: center;
    justify-items: center;
    grid-gap: 10px;
  }
  .modalbox-icon {
    width: 72px;
  }
  .modalbox-title {
    white-space: nowrap;
  }
  .modalbox-content {
    font-size: 16px;
    margin-bottom: 20px;
    text-align: justify;
  }
  .modalbox-footer {
    text-align: center;
    margin-top: 10px;
  }
  .modalbox-footer a {
    color: rgb(var(--font-color));
    text-decoration: underline;
  }
  .modalbox-footer a:hover {
    color: rgb(var(--background-color_button));
  }
  .error {
    color: #e74c3c;
    margin-bottom: 12px;
    font-size: 0.9rem;
  }
</style>
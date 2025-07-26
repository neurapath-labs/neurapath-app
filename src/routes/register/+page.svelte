<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';

  let username = '';
  let password = '';
  let confirmPassword = '';
  let errorMessage = '';

  
  $: errorMessage = $page.form?.error || '';
</script>

<div class="visible modalbox" id="modalbox-register">
  <form method="POST" action="?/register" use:enhance>
    <div class="modalbox-header">
      <img class="modalbox-icon" src="/img/logo.svg" alt="Neurapath logo" />
      <span class="modalbox-title">Register</span>
    </div>
    <div class="modalbox-content">
      Create a new account to access Neuraa.
    </div>
    
    {#if errorMessage}
      <div class="modalbox-error">
        {errorMessage}
      </div>
    {/if}
    
    <input class="modalbox-field" name="username" placeholder="Username..." bind:value={username} required />
    <input class="modalbox-field" name="password" type="password" placeholder="Password..." bind:value={password} required />
    <input class="modalbox-field" name="confirmPassword" type="password" placeholder="Confirm Password..." bind:value={confirmPassword} required />
    <button class="modalbox-button" type="submit">Register</button>
    <div class="modalbox-footer">
      <a href="/login">Already have an account? Login</a>
    </div>
  </form>
</div>

<style>
  .modalbox {
    position: absolute;
    overflow: scroll;
    background-color: rgb(var(--background-color_modalbox));
    color: rgb(var(--font-color));
    width: 400px;
    height: 450px;
    max-height: 600px;
    left: 50%;
    top: 50%;
    margin-left: -200px;
    margin-top: -300px;
    grid-template-columns: auto;
    grid-template-rows: auto;
    align-content: center;
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
    align-self: center;
    align-items: center;
    align-content: center;
    justify-content: center;
    justify-self: center;
    justify-items: center;
    grid-gap: 10px;
  }

  .modalbox-icon {
    text-align: center;
    width: 72px;
  }

  .modalbox-title {
    font-size: inherit;
    text-align: center;
    margin-bottom: 10px;
    white-space: nowrap;
  }

  .modalbox-content {
    font-size: 16px;
    margin-bottom: 20px;
    text-align: justify;
  }

  .modalbox-error {
    color: red;
    font-size: 14px;
    margin-bottom: 10px;
    text-align: center;
  }

  .modalbox-field {
    color: #555;
    background-color: white;
    padding: 10px 15px;
    border-radius: 4px;
    border: 1px solid #ccc;
    text-align: left;
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 15px;
  }

  .modalbox-field:focus {
    outline: none;
    border: 1px solid rgb(163, 205, 255);
  }

  .modalbox-button {
    border-color: rgb(var(--background-color));
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
    padding: 10px 15px;
    text-align: center;
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .modalbox-button:hover {
    background-color: rgba(var(--background-color_button-hover));
    cursor: pointer;
  }

  .modalbox-footer {
    text-align: center;
  }

  .modalbox-footer a {
    color: rgb(var(--font-color));
    text-decoration: underline;
  }

  .modalbox-footer a:hover {
    color: rgb(var(--background-color_button));
  }
</style>
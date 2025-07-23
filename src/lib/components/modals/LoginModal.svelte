<script lang="ts">
  let username = '';
  let password = '';
</script>

<div class="visible modalbox" id="modalbox-login">
  <form method="POST" action="?/login">
    <div class="modalbox-header">
      <img class="modalbox-icon" src="/img/logo.svg" alt="Evecloud logo">
      <span class="modalbox-title">EVE</span>
    </div>
    <div class="modalbox-content">
      Welcome aboard! Eve is specifically tailored for effective studying. <u>New user:</u> enter an username and password then press login in order to create an new account. <u>Old user:</u> Please enter your username and
      password below.
    </div>
    <input class="modalbox-field" id="modalbox-login-username" name="username" placeholder="Username..." bind:value={username}>
    <input class="modalbox-field" id="modalbox-login-password" name="password" type="password" placeholder="Password..." bind:value={password}>
    <button class="modalbox-button" id="modalbox-login-button" type="submit">Login!</button>
  </form>
</div>

<style>
  .modalbox {
    position: absolute;
    overflow: scroll;
    background-color: rgb(var(--background-color_modalbox));
    color: rgb(var(--font-color));
    width: 400px;
    height: 400px;
    max-height: 600px;
    left: 50%;
    top: 50%;
    margin-left: -200px;
    margin-top: -400px;
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

  .modalbox-field {
    color: #555;
    background-color: white;
    padding: 10px 15px;
    border-radius: 4px;
    border: 1px solid #ccc;
    text-align: left;
    width: 100%;
    box-sizing: border-box;
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
  }

  .modalbox-button:hover {
    background-color: rgba(var(--background-color_button-hover));
    cursor: pointer;
  }
</style>
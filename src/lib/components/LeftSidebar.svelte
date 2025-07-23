<script lang="ts">
  // Component logic will go here
</script>

<aside id="sidebar-left">
  <div id="logo-area">
    <img src="/img/logo.svg" alt="Evecloud logo">
    <div id="sidebar-title">EVE</div>
    <div id="sidebar-subtitle">Made in Sweden.</div>
    <div id="sidebar-saved">Last saved:
      <div id="sidebar-last-saved">-</div>
    </div>
    <br> 
    <div id="sidebar-due">Due today:
      <div id="sidebar-due-items">-</div>
    </div>
  </div>
  <div id="learning-button" class="start-learning-button">Engage!</div>
  <div id="menu">
    <div id="header-buttons">

      <div class="sidebar-item" id="header-settings-button">
        <img height="42px" width="42px" src="/img/user.svg" alt="Settings icon.">
        <span>Settings</span>
      </div>

      <div class="sidebar-item" id="header-darkmode-button">
        <img height="42px" width="42px" src="/img/night-mode.svg" alt="Darkmode icon.">
        <span id="darkmode-text">Dark mode</span>
      </div>

      <div class="sidebar-item" id="header-database-button">
        <img height="42px" width="42px" src="/img/database.svg" alt="Database icon.">
        <span id="database-text">Shared databases</span>
      </div>

      <div class="sidebar-item" id="header-explorer-button">
        <img height="42px" width="42px" src="/img/find.svg" alt="Item explorer icon.">
        <span id="explorer-text">Item explorer</span>
      </div>

      <div class="sidebar-item" id="header-flagged-button">
        <img height="42px" width="42px" src="/img/unflag.svg" alt="Flagged icon.">
        <span id="flag-text">Flagged items</span>
      </div>

      <div class="sidebar-item" id="header-statistics-button">
        <img height="42px" width="42px" src="/img/statistics.svg" alt="Statistics icon.">
        <span id="statistics-text">Statistics</span>
      </div>
      
    </div>
  </div>
  <div id="content-structure"></div>
</aside>

<style>
  #sidebar-left {
    grid-area: sidebar;
    width: min-content;
    height: 100vh;
    overflow: auto;
    background: rgba(var(--background-color_sidebar), 1);
    color: rgb(var(--font-color));
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: min-content min-content min-content 1fr;
    align-content: start;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  #logo-area {
    display: grid;
    grid-template-columns: 50px 1fr;
    grid-template-rows: 50px 1fr;
    grid-template-areas: "img logo""slogan slogan";
    grid-gap: 10px;
    padding: 10px;
    opacity: var(--zen-opacity);
  }

  #logo-area > img {
    grid-area: img;
    width: 50px;
    height: 50px;
    fill: red;
  }

  #sidebar-title {
    grid-area: logo;
    width: 50px;
    height: 50px;
    font-style: normal;
    font-weight: bold;
    font-size: 24px;
    line-height: 56px;
    text-transform: capitalize;
    color: rgb(var(--text-color));
  }

  #logo-area > #sidebar-subtitle {
    white-space: nowrap;
    grid-area: slogan;
    font-family: Poppins;
    font-style: italic;
    font-weight: normal;
    font-size: 12px;
    color: rgb(var(--text-color));
  }

  #sidebar-saved,
  #sidebar-last-saved {
    display: inline-block;
    white-space: nowrap;
    font-family: Poppins;
    font-style: italic;
    font-weight: normal;
    font-size: 12px;
    color: var(--text-color);
  }

  #sidebar-due,
  #sidebar-due-items {
    display: inline-block;
    white-space: nowrap;
    font-family: Poppins;
    font-style: italic;
    font-weight: normal;
    font-size: 12px;
    color: rgb(var(--text-color));
  }

  .start-learning-button {
    white-space: nowrap;
    font-size: 14px;
    padding: 10px 12px;
    margin: 0px 5px;
    border-radius: 5px;
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
    opacity: var(--zen-opacity);
  }

  .start-learning-button:hover {
    cursor: pointer;
    background-color: rgb(var(--background-color_button-hover));
  }

  .stop-learning-button {
    white-space: nowrap;
    font-size: 14px;
    padding: 10px 12px;
    margin: 0px 5px;
    border-radius: 5px;
    background-color: rgba(255, 101, 101, 0.719);
    color: white;
    opacity: var(--zen-opacity);
  }

  .stop-learning-button:hover {
    cursor: pointer;
    background-color: rgba(255, 129, 129, 0.719);
  }

  #header-buttons {
    grid-area: darkmode;
    justify-self: end;
    display: grid;
    grid-template-rows: min-content min-content min-content min-content min-content min-content;
    padding: 12px;
    grid-gap: 8px;
    background-color: rgb(var(--background-color_sidebar));
    border-bottom: 0px solid rgb(var(--background-color));
  }

  #content-structure {
    padding: 15px 20px 15px 5px;
    font-size: 14px;
    opacity: var(--zen-opacity);
  }

  #sidebar:hover #content-structure {
    opacity: 1 !important;
  }

  .sidebar-item {
    white-space: nowrap;
    font-size: 16px;
    color: rgb(var(--font-color));
    position: relative;
  }

  .sidebar-item > img {
    width: 16px;
    height: 16px;
  }

  .sidebar-item:hover {
    cursor: pointer;
    font-weight: 500;
  }
</style>
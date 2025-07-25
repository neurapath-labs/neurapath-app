<script lang="ts">
  import { ui } from '$lib/stores/ui.store';
  import { onMount, onDestroy } from 'svelte';

  // Using Svelte 5 runes for reactivity
  let isOpen: boolean = $state(false);
  let currentStep: number = $state(1);
  let totalSteps: number = $state(14);

  // Subscribe to UI changes
  let unsubscribeUI: (() => void) | undefined;

  onMount(() => {
    // Subscribe to UI changes
    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isTutorialOpen;
    });
  });

  onDestroy(() => {
    if (unsubscribeUI) unsubscribeUI();
  });

  // Function to go to the next step
  function nextStep() {
    if (currentStep < totalSteps) {
      currentStep += 1;
    }
  }

  // Function to go to the previous step
  function previousStep() {
    if (currentStep > 1) {
      currentStep -= 1;
    }
  }

  // Function to close the tutorial modal and mark as completed
  function completeTutorial() {
    ui.closeTutorial();
    // In a real implementation, we would also update the user profile
    // to mark the tutorial as completed
  }

  // Function to close the tutorial modal without completing
  function closeTutorial() {
    ui.closeTutorial();
  }
</script>

{#if isOpen}
  <div class="visible modalbox" id="modalbox-tutorial">
    <div class="modalbox-content">
      {#if currentStep === 1}
        <div class="modalbox-header">
          <img class="modalbox-icon" src="/img/tutorial.svg" alt="Tutorial icon" />
          <span class="modalbox-title">Quick start (1/{totalSteps})</span>
        </div>
        <div class="modalbox-content-text">
          <p>The left sidebar are used to organize your content. Here you will see when the database was last saved to the cloud and how many items that are due today. Here you will also find the engage button used for learning the material in your database.</p>
          <br />
          <p>Below the engage button all your folders, clozes, images and image occlusions will show. You are able to right-click in this sidebar in order to open an menu to handle the items.</p>
        </div>
      {:else if currentStep === 2}
        <div class="modalbox-header">
          <img class="modalbox-icon" src="/img/tutorial.svg" alt="Tutorial icon" />
          <span class="modalbox-title">Quick start (2/{totalSteps})</span>
        </div>
        <div class="modalbox-content-text">
          <p>Press here in order to start learning your material then use space key to show the answer. Then you should press CTRL + 1 - CTRL + 5 (default setting) in order to grade your item how well you know it. CTRL + 1 means you have no clue about the answer and CTRL + 5 means you know the answer well. Press CTRL + 3 if you get the right answer with difficulty and CTRL + 2 if you have some clue about the answer but got it wrong. To increase learning you should think about the answer before showing it. You can also say the answer to decrease bias.</p>
        </div>
      {:else if currentStep === 3}
        <div class="modalbox-header">
          <img class="modalbox-icon" src="/img/tutorial.svg" alt="Tutorial icon" />
          <span class="modalbox-title">Quick start (3/{totalSteps})</span>
        </div>
        <div class="modalbox-content-text">
          <p><u>Last saved</u> tells you when your database was saved to the cloud. Your encrypted database is uploaded to the cloud each 15 seconds.</p>
          <br />
          <p>(Your database are fully encrypted with AES256 before it is uploaded to the cloud. However all images uploaded to the cloud are unencrypted, but there is no way to be able to link which image is connected to which database.)</p>
        </div>
      {:else if currentStep === 4}
        <div class="modalbox-header">
          <img class="modalbox-icon" src="/img/tutorial.svg" alt="Tutorial icon" />
          <span class="modalbox-title">Quick start (4/{totalSteps})</span>
        </div>
        <div class="modalbox-content-text">
          <p><u>Due today</u> tells you how many items are due today. neurapath uses the same algoritm as Anki which is called SM-2 (SuperMemo 2) which is based on the forgetting curve in order to optimize learning. The numer within the parentheses tell you how many items in total that are due today which depends on which settings are disbled and enabled in your profile.</p>
        </div>
      {:else if currentStep === 5}
        <div class="modalbox-header">
          <img class="modalbox-icon" src="/img/tutorial.svg" alt="Tutorial icon" />
          <span class="modalbox-title">Quick start (5/{totalSteps})</span>
        </div>
        <div class="modalbox-content-text">
          <p><u>The main working window</u> is the primary workplace in Neuraa. Here you are able to manage the content of your current document. In this area you are able to paste formatted text and images (both inline and occlusions).</p>
          <br />
          <p><u>Create a text extract:</u> select the text content then press CTRL + X in order to extract some text this will push the text as an item for reading later, you will see due today will increase.</p>
          <br />
          <p><u>Create a cloze item (card) for learning:</u> select the text you want to hide and press CTRL + C (default) then it will be marked green. This will push the item into the learning queue.</p>
          <br />
          <p><u>Create an image occlusion:</u> drag and drop an image in this field then drag boxes onto the image then press CTRL + Z to generate an image occlusion or press ALT + Z in order to generate different occlusions for each box.</p>
        </div>
      {:else if currentStep === 6}
        <div class="modalbox-header">
          <img class="modalbox-icon" src="/img/user.svg" alt="User icon" />
          <span class="modalbox-title">Quick start (6/{totalSteps})</span>
        </div>
        <div class="modalbox-content-text">
          <p><u>The settings icon:</u> here you are able to set and view all your keyboard shourtcuts. You can also press profile in the left sidebar when window has open in order to configure your profile and user interface. In the profile page you are able to:</p>
          <br />
          <p>1) Configure the text of main working window</p>
          <p>2) Disable/enable extracts in learning mode</p>
          <p>3) Disable/enable occlusions in learning mode</p>
          <p>4) Disable/enable clozes in learning mode</p>
          <p>5) Hide/show images in left sidebar</p>
          <p>6) Hide/show right sidebar</p>
          <p>7) Share your database with friends</p>
          <p>8) Export a local backup</p>
          <p>9) Import a local backup</p>
          <p>10) Import Anki decks (experimental)</p>
          <p>11) Import Quizlet decks (experimental)</p>
        </div>
      {:else if currentStep === 7}
        <div class="modalbox-header">
          <img class="modalbox-icon" src="/img/night-mode.svg" alt="Night mode icon" />
          <span class="modalbox-title">Quick start (7/{totalSteps})</span>
        </div>
        <div class="modalbox-content-text">
          <p><u>Dark mode</u> great for your eyes.</p>
        </div>
      {:else if currentStep === 8}
        <div class="modalbox-header">
          <img class="modalbox-icon" src="/img/database.svg" alt="Database icon" />
          <span class="modalbox-title">Quick start (8/{totalSteps})</span>
        </div>
        <div class="modalbox-content-text">
          <p><u>Public / shared databases</u> is where people can share their database. If you go into settings then press make public this will make your database visible to other users. In order for people to import your database they have to press the name of the database then enter your account password. If you want to share your database with friends you have to go into profile, press make public then share your password with your friends then change the password to a new one.</p>
        </div>
      {:else if currentStep === 9}
        <div class="modalbox-header">
          <img class="modalbox-icon" src="/img/find.svg" alt="Find icon" />
          <span class="modalbox-title">Quick start (9/{totalSteps})</span>
        </div>
        <div class="modalbox-content-text">
          <p><u>Item finder</u> will let you find bad items. This might be due to wrongly formulated information. If the easiness of the item has not improved a lot and you have done a lot of Repetitions of the same item without improvement, you will find it here and be able to delete it or reformulate it, great place.</p>
        </div>
      {:else if currentStep === 10}
        <div class="modalbox-header">
          <img class="modalbox-icon" src="/img/unflag.svg" alt="Unflag icon" />
          <span class="modalbox-title">Quick start (10/{totalSteps})</span>
        </div>
        <div class="modalbox-content-text">
          <p><u>Flagged item</u> is where users tend to spend a lot of time. This feature will enable you to flag items during learning (enage mode). During repetition you can mark cards that are misspelled or has incorrect information with help of CTRL + F (default setting) in order to later come back and manage the card. In this window you will find all cards that has been flagged / marked.</p>
        </div>
      {:else if currentStep === 11}
        <div class="modalbox-header">
          <img class="modalbox-icon" src="/img/statistics.svg" alt="Statistics icon" />
          <span class="modalbox-title">Quick start (11/{totalSteps})</span>
        </div>
        <div class="modalbox-content-text">
          <p><u>The statistics window</u> will enable you to view the history of your database. Here you will find how many repetitions you have done each date and how many new items has been created.</p>
        </div>
      {:else if currentStep === 12}
        <div class="modalbox-header">
          <img class="modalbox-icon" src="/img/tutorial.svg" alt="Tutorial icon" />
          <span class="modalbox-title">Quick start (12/{totalSteps})</span>
        </div>
        <div class="modalbox-content-text">
          <p><u>The right sidebar</u> is used for assistance with information search. When you select a word in the main working window it will make a realtime word lookup and get it from Wikipedia. When you have marked the word in the main working window you can hold over items in this sidebar to get the definition of the word and click it in order the copy the content. You can easly paste the content into the main working area. If you right click then press import article Neuraa will create an new document in the left sidebar with the Wikipedia content for you.</p>
        </div>
      {:else if currentStep === 13}
        <div class="modalbox-header">
          <img class="modalbox-icon" src="/img/sine.svg" alt="Sine icon" />
          <span class="modalbox-title">Quick start (13/{totalSteps})</span>
        </div>
        <div class="modalbox-content-text">
          <p><u>A few more important things to know.</u> In order to get most out of Neuraa there is a few additional features you should know about. Ever feature can be found under profile then shortcuts. Features good to know are:</p>
          <br />
          <p><b>1) AI text summarization:</b> select text in main woring window then press CTRL + F. Within a few seconds you will get a subdocument with the new text.</p>
          <p><b>2) Occlusion generation:</b> in order to learn content from images you can both drop image files into the main working window but also press CTRL + V when you have copied an image.</p>
        </div>
      {:else if currentStep === 14}
        <div class="modalbox-header">
          <img class="modalbox-icon" src="/img/trophy.svg" alt="Trophy icon" />
          <span class="modalbox-title">Quick start (14/{totalSteps})</span>
        </div>
        <div class="modalbox-content-text">
          <p><u>Well done!</u> You do not know the most important features of Neuraa. You can join our Discord channel at: <a href="https://discord.gg/QKVf38QfCc" target="_blank" rel="noopener noreferrer">https://discord.gg/QKVf38QfCc</a> or contact us at email: <a href="mailto:hi@neurapath.io">hi@neurapath.io</a></p>
        </div>
      {/if}
    </div>

    <div class="modalbox-button-container">
      {#if currentStep === totalSteps}
        <button class="modalbox-button" on:click={completeTutorial} type="button">Complete tutorial!</button>
      {:else}
        <button class="modalbox-button" on:click={nextStep} type="button">Next</button>
      {/if}
      {#if currentStep > 1}
        <button class="modalbox-button" on:click={previousStep} type="button">Previous</button>
      {/if}
      {#if currentStep < totalSteps}
        <button class="modalbox-button" on:click={closeTutorial} type="button">Skip tutorial</button>
      {/if}
    </div>
  </div>
{/if}

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
    margin-bottom: 20px;
    max-height: 300px;
    overflow-y: auto;
  }

  .modalbox-content-text {
    line-height: 1.5;
  }

  .modalbox-content-text p {
    margin: 0 0 10px 0;
  }

  .modalbox-button-container {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }

  .modalbox-button {
    border-color: rgb(var(--background-color));
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
    padding: 10px 15px;
    text-align: center;
    border-radius: 4px;
    align-self: center;
    flex: 1;
  }

  .modalbox-button:hover {
    background-color: rgba(var(--background-color_button-hover));
    cursor: pointer;
  }

  .visible {
    display: block !important;
  }

  .hidden {
    display: none !important;
  }

  a {
    color: rgb(var(--font-color_link));
    text-decoration: underline;
  }

  a:hover {
    color: rgb(var(--font-color_link-hover));
  }
</style>
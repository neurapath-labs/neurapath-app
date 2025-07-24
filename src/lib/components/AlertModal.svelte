<script>
  import { modal } from '$lib/stores/modal.store';
  import { onDestroy } from 'svelte';

  let isOpen = false;
  let message = '';
  let type = 'default';

  // Subscribe to modal state
  const unsubscribe = modal.subscribe(($modal) => {
    isOpen = $modal.isAlertModalOpen;
    message = $modal.alertMessage;
    type = $modal.alertType;
  });

  // Clean up subscription
  onDestroy(() => {
    unsubscribe();
  });

  // Function to close the alert
  function closeAlert() {
    modal.closeAlert();
  }
</script>

{#if isOpen}
  <div class="modalbox-alert visible">
    <div class="modal-content {type}">
      <p>{message}</p>
      <button type="button" on:click={closeAlert}>Close</button>
    </div>
  </div>
{/if}

<style>
  .modalbox-alert {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modalbox-alert.hidden {
    display: none;
  }

  .modal-content {
    background-color: rgb(var(--background-color_modalbox));
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    max-width: 400px;
    width: 90%;
    text-align: center;
  }

  .modal-content p {
    margin: 0 0 20px 0;
    color: rgb(var(--font-color));
  }

  .modal-content.success {
    border-left: 4px solid #4caf50;
  }

  .modal-content.warning {
    border-left: 4px solid #ff9800;
  }

  .modal-content.danger {
    border-left: 4px solid #f44336;
  }

  .modal-content button {
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  .modal-content button:hover {
    background-color: rgb(var(--background-color_button-hover));
  }
</style>

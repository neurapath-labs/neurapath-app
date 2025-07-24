<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { profile } from '$lib/stores/profile.store';
  import { selection } from '$lib/stores/selection.store';
  import { contextmenu } from '$lib/stores/contextmenu.store';
  import { modal } from '$lib/stores/modal.store';
  
  let similarContent: any[] = [];
  let isLoading = false;
  let showRightSidebar = true;
  let selectionData: any = {};
  let lastRightClickedSimilarContentID: string | null = null;
  let relatedWords: any[] = [];
  let wikipediaArticles: any[] = [];
  
  // Subscribe to profile changes to get sidebar visibility settings
  const unsubscribe = profile.subscribe(($profile) => {
    showRightSidebar = $profile.showRightSidebar ?? true;
  });
  
  // Subscribe to selection changes
  const unsubscribeSelection = selection.subscribe(($selection) => {
    selectionData = $selection;
    // When selection changes, search for similar content
    if ($selection.isSelected) {
      searchSimilarContent($selection.text);
      searchRelatedWords($selection.text);
      searchWikipedia($selection.text);
    }
  });
  
  // Clean up subscription
  onDestroy(() => {
    unsubscribe();
    unsubscribeSelection();
  });
  
  // Function to search for similar content based on selected text
  const searchSimilarContent = async (query: string) => {
    if (!query || query.length < 3) {
      similarContent = [];
      return;
    }
    
    isLoading = true;
    
    try {
      // In a real implementation, this would call an API
      // For now, we'll simulate with mock data
      similarContent = [
        { id: '1', title: 'Related Article 1', content: 'This is the content of the first related article.' },
        { id: '2', title: 'Related Article 2', content: 'This is the content of the second related article.' },
        { id: '3', title: 'Related Article 3', content: 'This is the content of the third related article.' }
      ];
    } catch (error) {
      console.error('Error searching for similar content:', error);
      similarContent = [];
    } finally {
      isLoading = false;
    }
  };
  
  // Function to search for related words
  const searchRelatedWords = async (query: string) => {
    if (!query || query.length < 3) {
      relatedWords = [];
      return;
    }
    
    try {
      // In a real implementation, this would call an API
      // For now, we'll simulate with mock data
      relatedWords = [
        { word: 'related1', score: 0.9 },
        { word: 'related2', score: 0.8 },
        { word: 'related3', score: 0.7 }
      ];
    } catch (error) {
      console.error('Error searching for related words:', error);
      relatedWords = [];
    }
  };
  
  // Function to search Wikipedia
  const searchWikipedia = async (query: string) => {
    if (!query || query.length < 3) {
      wikipediaArticles = [];
      return;
    }
    
    try {
      // In a real implementation, this would call an API
      // For now, we'll simulate with mock data
      wikipediaArticles = [
        { title: 'Wikipedia Article 1', summary: 'This is the summary of the first Wikipedia article.' },
        { title: 'Wikipedia Article 2', summary: 'This is the summary of the second Wikipedia article.' }
      ];
    } catch (error) {
      console.error('Error searching Wikipedia:', error);
      wikipediaArticles = [];
    }
  };
  
  // Function to handle item clicks
  const handleItemClick = (item: any) => {
    console.log('Item clicked:', item);
    // TODO: Implement item click handling
  };
  
  // Function to handle context menu
  const handleContextMenu = (e: MouseEvent, id: string) => {
    e.preventDefault();
    lastRightClickedSimilarContentID = id;
    contextmenu.showContextMenu(e.clientX, e.clientY, id, 'sidebar-right-item');
  };
  
  // Function to import article
  const importArticle = () => {
    if (lastRightClickedSimilarContentID) {
      // TODO: Implement article import logic
      console.log('Import article with ID:', lastRightClickedSimilarContentID);
      modal.showAlert('Article imported successfully', 'success');
    }
  };
  
  // Function to create occlusion
  const createOcclusion = () => {
    if (lastRightClickedSimilarContentID) {
      // TODO: Implement occlusion creation logic
      console.log('Create occlusion from item with ID:', lastRightClickedSimilarContentID);
      modal.showAlert('Occlusion created successfully', 'success');
    }
  };
  
  // Function to copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      modal.showAlert('Text copied to clipboard', 'success');
    } catch (error) {
      console.error('Error copying text to clipboard:', error);
      modal.showAlert('Error copying text to clipboard', 'danger');
    }
  };
</script>

<aside id="sidebar-right" class:hidden={!showRightSidebar}>
  <div class="sidebar-section">
    <h5>Similar Content</h5>
    
    {#if isLoading}
      <div class="loading">Loading...</div>
    {:else if similarContent.length > 0}
      <div class="similar-content-list">
        {#each similarContent as item}
          <div
            class="similar-content-item"
            on:click={() => handleItemClick(item)}
            on:contextmenu={(e) => handleContextMenu(e, item.id)}
          >
            <h6>{item.title}</h6>
            <p>{item.content}</p>
          </div>
        {/each}
      </div>
    {:else}
      <div class="no-content">
        Select text to find similar content
      </div>
    {/if}
  </div>
  
  <div class="sidebar-section">
    <h5>Related Words</h5>
    
    {#if relatedWords.length > 0}
      <div class="related-words-list">
        {#each relatedWords as word}
          <div class="related-word-item" on:click={() => copyToClipboard(word.word)}>
            {word.word} ({word.score})
          </div>
        {/each}
      </div>
    {:else}
      <div class="no-content">
        No related words found
      </div>
    {/if}
  </div>
  
  <div class="sidebar-section">
    <h5>Wikipedia</h5>
    
    {#if wikipediaArticles.length > 0}
      <div class="wikipedia-list">
        {#each wikipediaArticles as article}
          <div
            class="wikipedia-item"
            on:click={() => copyToClipboard(article.summary)}
            on:contextmenu={(e) => handleContextMenu(e, article.title)}
          >
            <h6>{article.title}</h6>
            <p>{article.summary}</p>
          </div>
        {/each}
      </div>
    {:else}
      <div class="no-content">
        No Wikipedia articles found
      </div>
    {/if}
  </div>
</aside>

<style>
  #sidebar-right {
    display: block;
    overflow: auto;
    grid-area: similar;
    padding: var(--rightSidebar-padding);
    opacity: var(--zen-opacity);
  }
  
  #sidebar-right:hover {
    opacity: 1 !important;
  }
  
  .similar-content-item {
    color: rgb(var(--font-color));
    text-decoration: none;
    padding: 8px;
    margin-bottom: 8px;
    border-radius: 4px;
    background-color: rgba(var(--background-color_modalbox), 0.5);
  }
  
  .similar-content-item:hover {
    cursor: pointer;
    background-color: rgba(var(--background-color_modalbox), 1);
  }
  
  .loading, .no-content {
    text-align: center;
    padding: 16px;
    color: rgb(var(--font-color));
  }
  
  h5 {
    margin-top: 0;
  }
  
  h6 {
    margin: 0 0 4px 0;
  }
  
  p {
    margin: 0;
    font-size: 0.9em;
  }
</style>
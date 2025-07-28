import { get } from 'svelte/store';
import { selection } from '$lib/stores/selection.store';
import { database } from '$lib/stores/database.store';
import { toast } from "svelte-sonner";
import { profile } from '$lib/stores/profile.store';
import { createID } from '$lib/utils/helpers';
import type { Record } from '$lib/models';

// Define the type for our summarization response
interface SummarizationResponse {
  summary: string;
}

// Function to summarise text via OpenRouter
export const summarizeTextWithOpenRouter = async (
  text: string,
  apiKey: string,
  model: string = "qwen/qwen3-235b-a22b-thinking-2507"
): Promise<string> => {
  try {
    ('Calling OpenRouter API with text:', text.slice(0, 100) + '…');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        // Optional but recommended:
        // 'HTTP-Referer': window.location.origin, // your site/domain
        // 'X-Title': 'Neurapath',                    // short app name
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that summarizes text. Provide concise, clear summaries that capture the key points.',
          },
          {
            role: 'user',
            content: `Please summarize the following text:\n\n${text}`,
          },
        ],
      }),
    });

    ('OpenRouter API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    ('OpenRouter API response data:', data);
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error summarizing text with OpenRouter:', error);
    throw error;
  }
};


// Function to create a summary record in the database
export const createSummaryRecord = async (originalText: string, summary: string, parentId?: string): Promise<void> => {
  try {
    ('Creating summary record with parent ID:', parentId);
    const id = parentId ? `${parentId}/summary-${createID(6)}` : `summary-${createID(6)}`;
    ('Generated record ID:', id);
    
    const newRecord: Record = {
      id,
      contentType: 'Extract',
      content: {
        ops: [
          {
            insert: `Summary of selected text:\n\n${summary}`
          }
        ]
      }
    };
    
    ('Adding record to database:', newRecord);

    await database.addRecord(newRecord);
    ('Record added to database successfully');
  } catch (error) {
    console.error('Error creating summary record:', error);
    throw error;
  }
};

// Function to get API keys from profile
export const getApiKeysFromProfile = (): { openRouterApiKey: string; } => {
  const profileStore: any = get(profile);
  return {
    openRouterApiKey: profileStore.openRouterApiKey || ''
  };
};

// Main function to summarize selected text
export const summarizeSelectedText = async (apiKey: string, provider: 'openRouter' = 'openRouter'): Promise<boolean> => {
  try {
    ('Starting text summarization with provider:', provider);
    // Get current selection
    const selectionData = get(selection);
    ('Selection data:', selectionData);
    
    if (!selectionData.isSelected || !selectionData.text) {
      toast('Please select text to summarize');
      return false;
    }

    // Show processing message
    toast('Summarizing text...');

    // Summarize the text
    let summary: string;
    if (provider === 'openRouter') {
      ('Using OpenRouter provider');
      summary = await summarizeTextWithOpenRouter(selectionData.text, apiKey);
    }

    // Get active record for parent ID
    const databaseData = get(database);
    const activeRecord = databaseData.items.find(item =>
      item.contentType === 'Extract' || item.contentType === 'Cloze'
    ) || null;

    // Create a new record with the summary
    ('Creating summary record with parent ID:', activeRecord?.id);
    await createSummaryRecord(selectionData.text, summary, activeRecord?.id);

    // Show success message
    toast('Text summarized successfully!');
    return true;
  } catch (error: any) {
    console.error('Error summarizing text:', error);
    toast(`Error summarizing text: ${error.message || 'Unknown error'}`);
    return false;
  }
};
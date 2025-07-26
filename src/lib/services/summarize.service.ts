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

// Function to summarize text using OpenAI API
export const summarizeTextWithOpenAI = async (text: string, apiKey: string): Promise<string> => {
  try {
    console.log('Calling OpenAI API with text:', text.substring(0, 100) + '...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes text. Provide concise, clear summaries that capture the key points.'
          },
          {
            role: 'user',
            content: `Please summarize the following text:\n\n${text}`
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      })
    });
    
    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI API response data:', data);
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error summarizing text with OpenAI:', error);
    throw error;
  }
};

// Function to summarize text using Anthropic API
export const summarizeTextWithAnthropic = async (text: string, apiKey: string): Promise<string> => {
  try {
    console.log('Calling Anthropic API with text:', text.substring(0, 100) + '...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `Please summarize the following text:\n\n${text}`
          }
        ]
      })
    });
    
    console.log('Anthropic API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Anthropic API response data:', data);
    return data.content[0].text.trim();
  } catch (error) {
    console.error('Error summarizing text with Anthropic:', error);
    throw error;
  }
};

// Function to create a summary record in the database
export const createSummaryRecord = async (originalText: string, summary: string, parentId?: string): Promise<void> => {
  try {
    console.log('Creating summary record with parent ID:', parentId);
    const id = parentId ? `${parentId}/summary-${createID(6)}` : `summary-${createID(6)}`;
    console.log('Generated record ID:', id);
    
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
    
    console.log('Adding record to database:', newRecord);

    await database.addRecord(newRecord);
    console.log('Record added to database successfully');
  } catch (error) {
    console.error('Error creating summary record:', error);
    throw error;
  }
};

// Function to get API keys from profile
export const getApiKeysFromProfile = (): { openaiApiKey: string; anthropicApiKey: string } => {
  const profileStore: any = get(profile);
  return {
    openaiApiKey: profileStore.openaiApiKey || '',
    anthropicApiKey: profileStore.anthropicApiKey || ''
  };
};

// Main function to summarize selected text
export const summarizeSelectedText = async (apiKey: string, provider: 'openai' | 'anthropic' = 'openai'): Promise<boolean> => {
  try {
    console.log('Starting text summarization with provider:', provider);
    // Get current selection
    const selectionData = get(selection);
    console.log('Selection data:', selectionData);
    
    if (!selectionData.isSelected || !selectionData.text) {
      toast('Please select text to summarize');
      return false;
    }

    // Show processing message
    toast('Summarizing text...');

    // Summarize the text
    let summary: string;
    if (provider === 'openai') {
      console.log('Using OpenAI provider');
      summary = await summarizeTextWithOpenAI(selectionData.text, apiKey);
    } else {
      console.log('Using Anthropic provider');
      summary = await summarizeTextWithAnthropic(selectionData.text, apiKey);
    }
    console.log('Summary generated:', summary);

    // Get active record for parent ID
    const databaseData = get(database);
    const activeRecord = databaseData.items.find(item =>
      item.contentType === 'Extract' || item.contentType === 'Cloze'
    ) || null;

    // Create a new record with the summary
    console.log('Creating summary record with parent ID:', activeRecord?.id);
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
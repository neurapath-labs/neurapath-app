import type { Record } from '$lib/models';
import { database } from '$lib/stores/database.store';
import { toast } from "svelte-sonner";

// Function to extract text from PDF file using pdfjs-dist
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    // Dynamically import pdfjs-dist to avoid issues with server-side rendering
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set the worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.mjs';
    
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Concatenate all text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF: ' + (error as Error).message);
  }
};

// Function to create learning items from PDF content
export const createLearningItemsFromPDF = async (fileName: string, content: string, folderPath: string = ''): Promise<void> => {
  try {
    // Create a new extract record from the PDF content
    const newExtract: Record = {
      id: folderPath ? `${folderPath}/${fileName.replace('.pdf', '')}` : fileName.replace('.pdf', ''),
      contentType: 'Extract',
      content: {
        ops: [
          {
            insert: content
          }
        ]
      }
    };

    // Add the new record to the database
    await database.addRecord(newExtract);
    
    // Show success message
    toast(`Successfully imported ${fileName}`);
  } catch (error) {
    console.error('Error creating learning items from PDF:', error);
    throw new Error('Failed to create learning items from PDF');
  }
};

// Function to process PDF file and create learning items
export const processPDFFile = async (file: File, folderPath: string = ''): Promise<void> => {
  try {
    // Show processing message
    toast(`Processing ${file.name}...`);
    
    // Extract text from PDF
    const extractedText = await extractTextFromPDF(file);
    
    // Create learning items from extracted content
    await createLearningItemsFromPDF(file.name, extractedText, folderPath);
  } catch (error: any) {
    console.error('Error processing PDF file:', error);
    toast(`Error processing ${file.name}: ${error.message}`);
    throw error;
  }
};
export interface Record {
  id: string;
  contentType: 'Folder' | 'Cloze' | 'Extract' | 'Image' | 'Occlusion';
  content?: any;
  clozes?: Cloze[];
  occlusions?: Occlusion[];
  url?: string;
  priority?: number;
  repetition?: number;
  totalRepetitionCount?: number;
  isFlagged?: boolean;
  isPublic?: boolean;
  interval?: number;
  efactor?: number;
  dueDate?: string;
}

export interface Cloze {
  cloze: string;
  startindex: number;
  stopindex: number;
}

export interface Occlusion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Profile {
  version: string;
  id: number;
  reviewsTotalCount: number;
  dueCount: number;
  folderCount: number;
  extractCount: number;
  clozeCount: number;
  occlusionCount: number;
  isDatabasePublic: boolean;
  tutorialCompleted: boolean;
  mainWindowPadding: number;
  leftSidebarPadding: number;
  rightSidebarPadding: number;
  fontSize: number;
  showLeftSidebar: boolean;
  showRightSidebar: boolean;
  showExtractsInLearningMode: boolean;
  showOcclusionsInLearningMode: boolean;
  showClozesInLearningMode: boolean;
  showImagesInSidebar: boolean;
  mainWindowBackgroundColor: string;
  mainWindowFontColor: string;
  leftSidebarBackgroundColor: string;
  rightSidebarBackgroundColor: string;
  extractHighlightColor: string;
  clozeHighlightColor: string;
  showToolbar: boolean;
  theme: string;
  acceptedPolicy: boolean;
  statistics: { [date: string]: { reviewsCount?: number; newItemsCount?: number } };
  shortcuts: Shortcut[];
}

export interface Shortcut {
  event: string;
  keyCode: number;
  altKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
  shift: boolean;
  combination: string;
}

// Database interface for public databases
export interface Database {
  id: string;
  name: string;
  // Add other properties as needed based on the API response
}
// Generate a random id of length X
export function createID(length: number = 6): string {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// Add days to a date
declare global {
  interface Date {
    addDays(days: number): Date;
  }
}

Date.prototype.addDays = function(days: number): Date {
  const date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

// Check if device is mobile
export function mobileCheck(): boolean {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
}

// Convert Delta to raw text
export function deltaToRawText(delta: unknown): string {
  if (typeof delta === 'string') {
    return delta;
  }
  
  if (delta && typeof delta === 'object' && 'ops' in delta) {
    const ops = (delta as { ops: Array<{ insert?: string }> }).ops;
    return ops.map((op) => op.insert || '').join('');
  }
  
  return '';
}

// Get date today in YYYY-MM-DD format
export function getDateToday(): string {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

// Validation utilities
export const validation = {
  username: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_-]+$/,

    validate(username: string): { valid: boolean; error?: string } {
      if (!username || username.length < this.minLength) {
        return { valid: false, error: `Username must be at least ${this.minLength} characters` };
      }
      if (username.length > this.maxLength) {
        return { valid: false, error: `Username must be at most ${this.maxLength} characters` };
      }
      if (!this.pattern.test(username)) {
        return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
      }
      return { valid: true };
    }
  },

  password: {
    minLength: 6,

    validate(password: string): { valid: boolean; error?: string } {
      if (!password || password.length < this.minLength) {
        return { valid: false, error: `Password must be at least ${this.minLength} characters` };
      }
      return { valid: true };
    }
  }
};

// Debounce utility
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Throttle utility
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
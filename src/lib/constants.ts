// File upload constants
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_MB: 400,
  MAX_FILE_SIZE_BYTES: 400 * 1024 * 1024,
  SUPPORTED_FORMATS: ['MP3', 'MP4', 'WAV', 'M4A', 'AAC', 'FLAC', 'OGG', 'WEBM', 'AVI', 'MOV', 'WMV'],
  ACCEPTED_TYPES: 'audio/*,video/*'
} as const;

// Error messages
export const UPLOAD_ERROR_MESSAGES = {
  FILE_TOO_LARGE: (actualSize: string, maxSize: number) => 
    `File size (${actualSize} MB) exceeds the maximum limit of ${maxSize} MB. Please choose a smaller file.`,
  NO_FILE: 'No file selected',
  INVALID_FORMAT: 'Invalid file format. Please select an audio or video file.',
} as const; 
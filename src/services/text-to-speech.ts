/**
 * Asynchronously converts the given text into speech.
 *
 * @param text The text to be spoken.
 * @returns A promise that resolves when the text has been spoken.
 */
export async function speakResponse(text: string): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.error('Text-to-speech is not supported in this browser.');
    return;
  }
  const synth = window.speechSynthesis;
  let voices = synth.getVoices();

  // Wait for voices to be loaded if not yet available
  if (!voices.length) {
    await new Promise(resolve => {
      window.speechSynthesis.onvoiceschanged = resolve;
    });
    voices = synth.getVoices();
  }

  // Get preferred voice name from localStorage
  const preferredVoiceName = localStorage.getItem('preferredVoiceName');
  let selectedVoice = voices.find(v => v.name === preferredVoiceName);

  // Default: Telugu, then en-IN, then first
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang === 'te-IN')
      || voices.find(v => v.lang && v.lang.startsWith('en-IN'))
      || voices[0];
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.voice = selectedVoice || null;
  utter.lang = selectedVoice?.lang || 'te-IN';
  utter.rate = 0.7; // Slower speech
  synth.speak(utter);
}

// Utility: Get all available voices
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

// Utility: Set preferred voice by name (persisted in localStorage)
export function setPreferredVoice(voiceName: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferredVoiceName', voiceName);
  }
}



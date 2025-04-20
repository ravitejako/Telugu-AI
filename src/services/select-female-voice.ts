import { getAvailableVoices, setPreferredVoice } from '@/services/text-to-speech';

/**
 * Selects and sets the first available female voice for speech synthesis.
 * Priority: Telugu female > Indian English female > any female > first available.
 * @returns The name of the selected voice, or null if none found.
 */
function selectFemaleVoice(): string | null {
  const voices = getAvailableVoices();
  // Try Telugu female first
  let femaleVoice = voices.find(v => v.lang === 'te-IN' && v.name.toLowerCase().includes('female'));
  if (!femaleVoice) {
    // Try any Indian English female
    femaleVoice = voices.find(v => v.lang && v.lang.startsWith('en-IN') && v.name.toLowerCase().includes('female'));
  }
  if (!femaleVoice) {
    // Try any female
    femaleVoice = voices.find(v => v.name.toLowerCase().includes('female'));
  }
  if (!femaleVoice && voices.length) {
    // As a fallback, pick the first available voice
    femaleVoice = voices[0];
  }
  if (femaleVoice) {
    setPreferredVoice(femaleVoice.name);
    return femaleVoice.name;
  }
  return null;
}

export default selectFemaleVoice;

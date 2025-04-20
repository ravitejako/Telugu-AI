/**
 * Asynchronously captures audio from the user's microphone and converts it to text.
 *
 * @returns A promise that resolves to the transcribed text from the user's speech.
 */
/**
 * Asynchronously captures audio from the user's microphone and converts it to text in the specified language.
 *
 * @param lang The BCP-47 language code (e.g., 'te-IN', 'hi-IN', etc.). Defaults to 'te-IN'.
 * @returns A promise that resolves to the transcribed text from the user's speech.
 */
export async function getVoiceInput(lang: string = 'te-IN'): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      reject(new Error('Speech recognition is not supported in this browser. Please use Chrome or Edge.'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };
    recognition.onerror = (event: any) => {
      reject(new Error(event.error || 'Speech recognition error occurred.'));
    };
    recognition.onnomatch = () => {
      reject(new Error('Could not recognize speech. Please try again.'));
    };

    recognition.start();
  });
}

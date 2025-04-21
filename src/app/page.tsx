'use client';

import {generateRomanTeluguResponse} from '@/ai/flows/generate-roman-telugu-response';
import {choosePersona} from '@/ai/flows/choose-persona';
import {getVoiceInput} from '@/services/speech-recognition';
import {speakResponse, getAvailableVoices, setPreferredVoice} from '@/services/text-to-speech';

import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {useEffect, useRef, useState} from 'react';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {useToast} from '@/hooks/use-toast';
import {Toaster} from '@/components/ui/toaster';

type ChatMessage = { role: 'user' | 'ai', content: string };

export default function Home() {
  // Speech recognition support state
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(true);
  const [userInput, setUserInput] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [persona, setPersona] = useState('bro');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const {toast} = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  // Language selection removed. Default to Telugu only.
  const selectedLang = 'te-IN';

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Check for speech recognition support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSpeechRecognitionSupported(!!SpeechRecognition);
    }
  }, []);

  // Only run on client: fetch voices and preferred voice
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const updateVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      const preferred = typeof window !== 'undefined' ? window.localStorage.getItem('preferredVoiceName') : '';
      setSelectedVoice(preferred && v.some(voice => voice.name === preferred) ? preferred : '');
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleVoiceInput = async () => {
    try {
      const voiceText = await getVoiceInput(selectedLang);
      setUserInput(voiceText);
    } catch (error: any) {
      toast({
        title: 'Error recording voice',
        description: error.message,
        variant: 'destructive',
      });
      console.error('Error recording voice:', error);
    }
  };

  const handlePersonaChange = (value: string) => {
    setPersona(value);
  };

  const handleSubmit = async () => {
    if (!userInput.trim()) return;
    setChat(prev => [...prev, {role: 'user', content: userInput}]);
    setUserInput('');
    try {
      let response;
      // Language selection removed. Always prompt in Telugu.
      const strongPrompt = `IMPORTANT: Reply ONLY in Telugu. Use Telugu script. User said: ${userInput}`;
      if (persona) {
        response = await choosePersona({
          userInput: strongPrompt,
          persona: persona
        });
      } else {
        response = await generateRomanTeluguResponse({
          userInput: strongPrompt
        });
      }
      // Support both response.response and response.bestieResponse
      const aiText = (response.response ?? response.bestieResponse ?? '');
      setChat(prev => [...prev, {role: 'ai', content: aiText}]);
      await speakResponse(aiText);
    } catch (error: any) {
      toast({
        title: 'Error generating AI response',
        description: error.message,
        variant: 'destructive',
      });
      setChat(prev => [...prev, {role: 'ai', content: 'Anukokunda jarigindi! Malli try cheyandi.'}]);
      console.error('Error generating AI response:', error);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const [darkMode, setDarkMode] = useState(true);
  // Professional font
  const fontFamily = 'Inter, system-ui, sans-serif';
  // Color palettes
  const darkBg = 'bg-[#18181b]';
  const lightBg = 'bg-[#f7f7fa]';
  const containerBg = darkMode ? 'bg-[#232336]/95 shadow-xl' : 'bg-white/90 shadow-lg';
  const headerBg = darkMode ? 'bg-[#1b1b24]/90 border-b border-[#23234d]' : 'bg-white/90 border-b border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const aiBubble = darkMode ? 'bg-[#23234d]/80 text-white border border-[#353570]' : 'bg-[#f1f3fa] text-gray-900 border border-gray-200';
  const userBubble = darkMode ? 'bg-gradient-to-br from-[#6366f1] to-[#a21caf] text-white' : 'bg-gradient-to-br from-[#a5b4fc] to-[#fbc2eb] text-gray-900';
  const inputBg = darkMode ? 'bg-[#22223b]/80 border-[#353570]' : 'bg-white border-gray-300';
  const avatarAi = darkMode ? 'bg-gradient-to-br from-purple-700 to-blue-700 text-white border-[#23234d]' : 'bg-gradient-to-br from-blue-200 to-purple-200 text-gray-900 border-[#e3e6f3]';
  const avatarUser = darkMode ? 'bg-gradient-to-br from-gray-700 to-gray-900 text-white border-[#23234d]' : 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-900 border-[#e3e6f3]';

  return (
    <div className={`min-h-screen w-full flex flex-col items-center ${darkMode ? darkBg : lightBg}`} style={{
      fontFamily,
      transition: 'background 0.3s',
    }}>
      <Toaster />
      {/* Header */}
      <header className={`w-full fixed top-0 left-0 z-40 ${headerBg} flex items-center justify-between px-6 py-3`}>
        <span className={`text-2xl font-bold tracking-tight ${textPrimary}`}>Telugu AI</span>
        <div className="flex items-center gap-4">
          {/* Voice Selection Dropdown */}
          {voices.length > 1 && (
            <select
              value={selectedVoice}
              onChange={e => {
                setSelectedVoice(e.target.value);
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('preferredVoiceName', e.target.value);
                }
              }}
              className={`rounded-lg px-3 py-2 text-base font-medium border focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-200 ${darkMode ? 'bg-[#23234d] text-white border-[#353570] hover:bg-[#353570]' : 'bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200'}`}
              aria-label="Select voice for speech output"
            >
              <option value="">Default Voice</option>
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          )}
          <button
            className={`rounded-full px-4 py-2 font-bold shadow transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 ${darkMode ? 'bg-[#23234d] text-white hover:bg-[#353570]' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
            onClick={() => setDarkMode(m => !m)}
            aria-label="Toggle dark/light mode"
          >
            {darkMode ? '🌞 Light' : '🌙 Dark'}
          </button>
        </div>
      </header>
      {/* Main Container */}
      <main className={`w-full flex flex-col items-center pt-20 pb-0 px-2 flex-1`}>
        <section className={`w-full max-w-2xl flex flex-col flex-1 rounded-2xl ${containerBg} px-0 pb-0 pt-2 min-h-[70vh]`}>
          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto px-4 pt-2 pb-36" style={{scrollbarWidth: 'thin', scrollbarColor: darkMode ? '#353570 #22223b' : '#e3e6f3 #fff'}}>
            {chat.length === 0 && (
              <div className={`text-center mt-16 text-lg font-medium ${textSecondary}`}>Start the conversation!</div>
            )}
            {chat.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-end mb-6 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                style={{
                  minHeight: '56px',
                  paddingLeft: msg.role === 'ai' ? '0' : '10vw',
                  paddingRight: msg.role === 'user' ? '0' : '10vw',
                }}
              >
                {msg.role === 'ai' && (
                  <div className={`flex-shrink-0 w-9 h-9 ${avatarAi} rounded-full flex items-center justify-center mr-3 font-bold text-lg shadow border-2 avatar-ai`} aria-label="AI Avatar">🤖</div>
                )}
                <div
                  className={`max-w-[70%] px-5 py-3 rounded-2xl shadow ${msg.role === 'user' ? userBubble : aiBubble} whitespace-pre-line text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-200 chat-bubble`}
                  tabIndex={0}
                  aria-label={msg.role === 'user' ? 'Your message' : 'AI response'}
                  style={{
                    boxShadow: msg.role === 'ai' ? (darkMode ? '0 2px 12px 0 #23234d44' : '0 2px 10px 0 #e3e6f344') : (darkMode ? '0 2px 12px 0 #a21caf33' : '0 2px 10px 0 #fbc2eb33'),
                    marginLeft: msg.role === 'ai' ? '0' : 'auto',
                    marginRight: msg.role === 'user' ? '0' : 'auto',
                  }}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className={`flex-shrink-0 w-9 h-9 ${avatarUser} rounded-full flex items-center justify-center ml-3 font-bold text-lg shadow border-2 avatar-user`} aria-label="User Avatar">🧑‍🚀</div>
                )}
              </div>
            ))}
          </div>
          {/* Input Bar */}
          {/* Speech recognition support warning */}
          {!isSpeechRecognitionSupported && (
            <div className="w-full text-center mb-2 text-red-600 bg-red-50 border border-red-200 rounded p-2 text-sm" role="alert">
              Voice input is not supported on this browser/device. Please use Chrome on Android or a compatible browser for voice features.
            </div>
          )}
          <form
            className={`fixed bottom-0 left-0 w-full max-w-2xl mx-auto flex gap-3 items-end rounded-t-2xl shadow-2xl border-t z-50 transition-colors duration-300 ${containerBg} px-4 py-4 input-bar`}
            style={{left: '50%', transform: 'translateX(-50%)'}}
            onSubmit={e => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <Textarea
              ref={textareaRef}
              placeholder="Type your message..."
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              rows={1}
              className={`flex-1 resize-none rounded-xl shadow border transition-colors duration-300 font-medium placeholder:opacity-70 ${inputBg} ${textPrimary} focus:border-blue-400 focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400/80`}
              style={{minHeight: '46px', maxHeight: '120px'}}
              aria-label="Type your message"
            />
            <Button
              type="button"
              onClick={handleVoiceInput}
              className={`rounded-full p-3 shadow transition-colors text-xl focus:outline-none focus:ring-2 focus:ring-blue-400 ${darkMode ? 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-purple-700 hover:to-blue-700 text-white' : 'bg-gradient-to-br from-blue-300 to-purple-300 hover:from-purple-400 hover:to-blue-400 text-gray-900'}`}
              aria-label="Voice Input"
              disabled={!isSpeechRecognitionSupported}
              title={!isSpeechRecognitionSupported ? 'Voice input not supported on this browser/device' : ''}
            >
              <span role="img" aria-label="Microphone">🎤</span>
            </Button>
            <Button
              type="submit"
              className={`rounded-full p-3 shadow transition-colors font-bold text-xl focus:outline-none focus:ring-2 focus:ring-blue-400 ${darkMode ? 'bg-gradient-to-tr from-purple-600 to-blue-500 hover:from-blue-600 hover:to-purple-700 text-white' : 'bg-gradient-to-tr from-purple-300 to-blue-300 hover:from-blue-400 hover:to-purple-400 text-gray-900'}`}
              aria-label="Send"
            >
              ➤
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}


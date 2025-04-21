'use client';

import {generateRomanTeluguResponse} from '@/ai/flows/generate-roman-telugu-response';
import {choosePersona} from '@/ai/flows/choose-persona';
import {getVoiceInput} from '@/services/speech-recognition';
import {speakResponse, getAvailableVoices, setPreferredVoice} from '@/services/text-to-speech';

import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {useEffect, useRef, useState} from 'react';

import {useToast} from '@/hooks/use-toast';
import {Toaster} from '@/components/ui/toaster';

import React from 'react';
type ChatMessage = { role: 'user' | 'ai', content: string };

type PersonaType = 'bro' | 'akka' | 'mass bestie' | 'formal assistant';

type ResponseType = {
  response?: string;
  bestieResponse?: string;
};

// Memoized chat bubble for performance
const ChatBubble = React.memo(function ChatBubble({msg, darkMode, userBubble, aiBubble}: {msg: ChatMessage, darkMode: boolean, userBubble: string, aiBubble: string}) {
  return (
    <div
      className={`max-w-[85%] sm:max-w-[70%] px-3 sm:px-5 py-2 sm:py-3 rounded-2xl shadow ${msg.role === 'user' ? userBubble : aiBubble} whitespace-pre-line text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-200 chat-bubble`}
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
  );
});

// Animated Typing... indicator
const TypingAnimated = () => {
  const [dotCount, setDotCount] = React.useState(1);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((c) => (c % 3) + 1);
    }, 400);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="typing-indicator" aria-label="AI is typing">
      <span>Typing{'.'.repeat(dotCount)}</span>
    </div>
  );
};

export default function Home() {
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(true);
  const [userInput, setUserInput] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [persona, setPersona] = useState<PersonaType>('bro');
  const {toast} = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const selectedLang = 'te-IN';
  const [darkMode, setDarkMode] = useState(true);

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

  const handleVoiceInput = React.useCallback(async () => {
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
  }, [selectedLang, toast]);

  const handlePersonaChange = React.useCallback((value: string) => {
    setPersona(value as PersonaType);
  }, []);

  const [loading, setLoading] = useState(false);

  // Auto-scroll to bottom on new message or loading
  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat, loading]);
  const handleSubmit = React.useCallback(async () => {
    if (!userInput.trim()) return;
    setChat(prev => [...prev, {role: 'user', content: userInput}]);
    setUserInput('');
    setLoading(true);
    try {
      let response: ResponseType;
      const strongPrompt = `IMPORTANT: Reply ONLY in Telugu. Use Telugu script. User said: ${userInput}`;
      if (persona) {
        response = await choosePersona({ userInput: strongPrompt, persona });
      } else {
        response = await generateRomanTeluguResponse({ userInput: strongPrompt });
      }
      const aiText = response.response || response.bestieResponse || '';
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
    } finally {
      setLoading(false);
    }
  }, [userInput, persona, toast]);

  const handleInputKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Professional font
  const fontFamily = 'Inter, system-ui, sans-serif';
  // Color palettes
  const darkBg = 'bg-[#0A0A0A]';
  const lightBg = 'bg-[#FAFAFA]';
  const containerBg = darkMode ? 'bg-[#0A0A0A]/95 shadow-xl' : 'bg-[#FAFAFA]/90 shadow-lg';
  const headerBg = darkMode ? 'bg-[#111111]/90 border-b border-[#222222]' : 'bg-white/90 border-b border-gray-100';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const aiBubble = darkMode ? 'bg-[#1A1A1A] text-white border border-[#333333]' : 'bg-white text-gray-900 border border-gray-100';
  const userBubble = darkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white';
  const inputBg = darkMode ? 'bg-[#1A1A1A]/80 border-[#333333]' : 'bg-white border-gray-200';
  const avatarAi = darkMode ? 'bg-[#1A1A1A] text-white border-[#333333]' : 'bg-white text-gray-900 border-gray-100';
  const avatarUser = darkMode ? 'bg-[#1A1A1A] text-white border-[#333333]' : 'bg-white text-gray-900 border-gray-100';

  return (
    <div className={`min-h-screen w-full flex flex-col ${darkMode ? 'bg-[#0A0A0A]' : 'bg-[#FAFAFA]'}`}>
      <Toaster />
      {/* Header */}
      <header className={`w-full fixed top-0 left-0 z-40 ${darkMode ? 'bg-[#111111]/90 border-[#222222]' : 'bg-white/90 border-gray-100'} backdrop-blur-md border-b flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4`}>
        <span className={`text-xl sm:text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Telugu AI</span>
        <div className="flex items-center gap-2 sm:gap-4">
          {voices.length > 1 && (
            <select
              value={selectedVoice}
              onChange={e => {
                setSelectedVoice(e.target.value);
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('preferredVoiceName', e.target.value);
                }
              }}
              className={`rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base font-medium border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200 ${
                darkMode 
                  ? 'bg-[#1A1A1A] text-white border-[#333333] hover:bg-[#222222]' 
                  : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
              }`}
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
            className={`rounded-full p-2 sm:p-2.5 font-medium shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base transform hover:scale-105 ${
              darkMode 
                ? 'bg-[#1A1A1A] text-white hover:bg-[#222222] border border-[#333333]' 
                : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
            }`}
            onClick={() => setDarkMode(m => !m)}
            aria-label="Toggle dark/light mode"
          >
            {darkMode ? '🌞' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full flex flex-col items-center pt-20 sm:pt-24 pb-0 px-0 flex-1">
        <section className={`w-full max-w-3xl flex flex-col flex-1 ${darkMode ? 'bg-[#0A0A0A]' : 'bg-[#FAFAFA]'} min-h-[70vh]`}>
          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-24 sm:pb-32" style={{scrollbarWidth: 'thin', scrollbarColor: darkMode ? '#333333 #1A1A1A' : '#E5E5E5 #FFFFFF'}}>
            {chat.length === 0 && (
              <div className={`text-center mt-12 sm:mt-16 space-y-4`}>
                <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Welcome to Telugu AI
                </h1>
                <p className={`text-base sm:text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Start a conversation in Telugu or English
                </p>
              </div>
            )}
            {chat.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-end mb-6 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ai' && (
                  <div className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center mr-3 font-bold text-base sm:text-lg border-2 ${
                    darkMode 
                      ? 'bg-[#1A1A1A] text-white border-[#333333]' 
                      : 'bg-white text-gray-900 border-gray-100'
                  }`} aria-label="AI Avatar">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-lg ${
                    msg.role === 'user'
                      ? darkMode
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-500 text-white'
                      : darkMode
                      ? 'bg-[#1A1A1A] text-white border border-[#333333]'
                      : 'bg-white text-gray-900 border border-gray-100'
                  } whitespace-pre-line text-sm sm:text-base font-medium`}
                  style={{
                    boxShadow: msg.role === 'ai' 
                      ? (darkMode ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.05)') 
                      : '0 4px 20px rgba(147,51,234,0.2)',
                  }}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ml-3 font-bold text-base sm:text-lg border-2 ${
                    darkMode 
                      ? 'bg-[#1A1A1A] text-white border-[#333333]' 
                      : 'bg-white text-gray-900 border-gray-100'
                  }`} aria-label="User Avatar">
                    👤
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="w-full flex justify-start mb-6 pl-[5vw]">
                <div className={`flex items-center gap-1 px-4 py-2 rounded-full ${
                  darkMode ? 'bg-[#1A1A1A] text-gray-400' : 'bg-white text-gray-500'
                } border ${darkMode ? 'border-[#333333]' : 'border-gray-200'}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          {!isSpeechRecognitionSupported && (
            <div className="fixed bottom-24 left-0 w-full px-4 sm:px-0">
              <div className="w-full max-w-3xl mx-auto">
                <div className="text-center mb-2 text-xs sm:text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-2" role="alert">
                  Voice input is not supported on this browser/device. Please use Chrome on Android or a compatible browser for voice features.
                </div>
              </div>
            </div>
          )}
          <form
            className={`fixed bottom-0 left-0 w-full ${darkMode ? 'bg-[#111111]/90 border-[#222222]' : 'bg-white/90 border-gray-100'} backdrop-blur-md border-t`}
            style={{left: '50%', transform: 'translateX(-50%)'}}
            onSubmit={e => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex gap-2 sm:gap-3 items-end">
              <Textarea
                ref={textareaRef}
                placeholder="Type your message..."
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                rows={1}
                className={`flex-1 resize-none rounded-xl shadow-sm border transition-all duration-200 font-medium placeholder:opacity-70 text-sm sm:text-base focus:ring-2 focus:ring-purple-500 ${
                  darkMode 
                    ? 'bg-[#1A1A1A] text-white border-[#333333] focus:bg-[#222222]' 
                    : 'bg-white text-gray-900 border-gray-200 focus:bg-gray-50'
                }`}
                style={{minHeight: '44px', maxHeight: '120px'}}
                aria-label="Type your message"
              />
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`rounded-xl p-3 shadow-lg transition-all duration-300 text-lg sm:text-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transform hover:scale-105 ${
                  darkMode 
                    ? 'bg-[#1A1A1A] text-white hover:bg-[#222222] border border-[#333333]' 
                    : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
                }`}
                aria-label="Voice Input"
                disabled={!isSpeechRecognitionSupported}
                title={!isSpeechRecognitionSupported ? 'Voice input not supported on this browser/device' : ''}
              >
                🎤
              </button>
              <button
                type="submit"
                className={`rounded-xl p-3 shadow-lg transition-all duration-300 font-bold text-lg sm:text-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transform hover:scale-105 ${
                  darkMode 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
                aria-label="Send"
              >
                ➤
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}


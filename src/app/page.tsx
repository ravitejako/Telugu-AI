'use client';

import {generateRomanTeluguResponse} from '@/ai/flows/generate-roman-telugu-response';
import {choosePersona} from '@/ai/flows/choose-persona';
import {getVoiceInput} from '@/services/speech-recognition';
import {speakResponse} from '@/services/text-to-speech';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {useEffect, useRef, useState} from 'react';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {useToast} from '@/hooks/use-toast';
import {Toaster} from '@/components/ui/toaster';

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [persona, setPersona] = useState('bro');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const {toast} = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleVoiceInput = async () => {
    try {
      const voiceText = await getVoiceInput();
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
    try {
      let response;
      if (persona) {
        response = await choosePersona({userInput: userInput, persona: persona});
      } else {
        response = await generateRomanTeluguResponse({userInput: userInput});
      }
      setAiResponse(response.response);
      await speakResponse(response.response);
    } catch (error: any) {
      toast({
        title: 'Error generating AI response',
        description: error.message,
        variant: 'destructive',
      });
      console.error('Error generating AI response:', error);
      setAiResponse('Anukokunda jarigindi! Malli try cheyandi.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-10 bg-secondary">
      <Toaster />
      <Card className="w-full max-w-2xl p-4 rounded-lg shadow-md bg-background">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-primary">Telugu Bestie AI</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Interact with a Telugu AI that responds like your bestie.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Textarea
              ref={textareaRef}
              placeholder="Nuvvu emi cheyalanukuntunnavu?"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              className="rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus-visible:ring-primary"
            />
            <div className="flex justify-between items-center">
              <Button onClick={handleVoiceInput} className="bg-accent text-accent-foreground hover:bg-accent/80">
                Voice Input
              </Button>
              <Select onValueChange={handlePersonaChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Choose Persona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bro">Bro</SelectItem>
                  <SelectItem value="akka">Akka</SelectItem>
                  <SelectItem value="mass bestie">Mass Bestie</SelectItem>
                  <SelectItem value="formal assistant">Formal Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSubmit} className="bg-primary text-primary-foreground hover:bg-primary/80">
            Bestie Cheppu
          </Button>
          {aiResponse && (
            <div className="mt-4 p-3 rounded-md bg-muted">
              <p className="text-secondary-foreground">{aiResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


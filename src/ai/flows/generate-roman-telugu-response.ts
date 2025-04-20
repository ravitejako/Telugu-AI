'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating Roman Telugu responses as if from a Telugu bestie.
 *
 * - generateRomanTeluguResponse - A function that generates a Roman Telugu response.
 * - GenerateRomanTeluguResponseInput - The input type for the generateRomanTeluguResponse function.
 * - GenerateRomanTeluguResponseOutput - The return type for the generateRomanTeluguResponse function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getVoiceInput} from '@/services/speech-recognition';
import {speakResponse} from '@/services/text-to-speech';

const GenerateRomanTeluguResponseInputSchema = z.object({
  userInput: z.string().describe('The user input to be processed.'),
});
export type GenerateRomanTeluguResponseInput = z.infer<typeof GenerateRomanTeluguResponseInputSchema>;

const GenerateRomanTeluguResponseOutputSchema = z.object({
  bestieResponse: z.string().describe('The Roman Telugu response from the AI bestie.'),
});
export type GenerateRomanTeluguResponseOutput = z.infer<typeof GenerateRomanTeluguResponseOutputSchema>;

export async function generateRomanTeluguResponse(input: GenerateRomanTeluguResponseInput): Promise<GenerateRomanTeluguResponseOutput> {
  return generateRomanTeluguResponseFlow(input);
}

const romanTeluguBestiePrompt = ai.definePrompt({
  name: 'romanTeluguBestiePrompt',
  input: {
    schema: z.object({
      userInput: z.string().describe('The user input to be processed.'),
    }),
  },
  output: {
    schema: z.object({
      bestieResponse: z.string().describe('The Roman Telugu response from the AI bestie.'),
    }),
  },
  prompt: `You are a friendly Telugu bestie who replies in Roman Telugu only.\n\nStyle: Casual, fun, slangy. Never formal. Never translate word-by-word. Just reply like a Telugu buddy using English letters.\n\nUser: {{{userInput}}}\nAssistant:`,
});

const generateRomanTeluguResponseFlow = ai.defineFlow<
  typeof GenerateRomanTeluguResponseInputSchema,
  typeof GenerateRomanTeluguResponseOutputSchema
>(
  {
    name: 'generateRomanTeluguResponseFlow',
    inputSchema: GenerateRomanTeluguResponseInputSchema,
    outputSchema: GenerateRomanTeluguResponseOutputSchema,
  },
  async input => {
    const {output} = await romanTeluguBestiePrompt(input);
    return output!;
  }
);

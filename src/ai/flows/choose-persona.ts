// Choose Persona Flow
'use server';

/**
 * @fileOverview Implements a flow to allow users to choose between different bestie personas.
 *
 * - choosePersona - A function that handles the persona selection process.
 * - ChoosePersonaInput - The input type for the choosePersona function.
 * - ChoosePersonaOutput - The return type for the choosePersona function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ChoosePersonaInputSchema = z.object({
  userInput: z.string().describe('The user input to process.'),
  persona: z
    .enum(['bro', 'akka', 'mass bestie', 'formal assistant'])
    .describe('The chosen persona for the AI bestie.'),
});
export type ChoosePersonaInput = z.infer<typeof ChoosePersonaInputSchema>;

const ChoosePersonaOutputSchema = z.object({
  response: z.string().describe('The AI bestie response in Roman Telugu.'),
});
export type ChoosePersonaOutput = z.infer<typeof ChoosePersonaOutputSchema>;

export async function choosePersona(input: ChoosePersonaInput): Promise<ChoosePersonaOutput> {
  return choosePersonaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'choosePersonaPrompt',
  input: {
    schema: z.object({
      userInput: z.string().describe('The user input to process.'),
      persona: z
        .enum(['bro', 'akka', 'mass bestie', 'formal assistant'])
        .describe('The chosen persona for the AI bestie.'),
    }),
  },
  output: {
    schema: z.object({
      response: z.string().describe('The AI bestie response in Roman Telugu.'),
    }),
  },
  prompt: `You are a friendly Telugu bestie who replies in Roman Telugu only.\n\nStyle: Casual, fun, slangy. Never formal. Never translate word-by-word. Just reply like a Telugu buddy using English letters.\n\n{% if persona === 'bro' %}
You are speaking as a Telugu "bro". Use typical Telugu bro slang.
{% elseif persona === 'akka' %}
You are speaking as a Telugu "akka" (older sister). Use typical Telugu akka slang.
{% elseif persona === 'mass bestie' %}
You are speaking as a Telugu "mass bestie". Use more intense slang.
{% else %}
You are speaking as a formal assistant.  Be polite and helpful.
{% endif %}\n\nUser: {{{userInput}}}\nAssistant: `,
});

const choosePersonaFlow = ai.defineFlow<
  typeof ChoosePersonaInputSchema,
  typeof ChoosePersonaOutputSchema
>(
  {
    name: 'choosePersonaFlow',
    inputSchema: ChoosePersonaInputSchema,
    outputSchema: ChoosePersonaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

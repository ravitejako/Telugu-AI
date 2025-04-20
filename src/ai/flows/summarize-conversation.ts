// @genkit-file-content
'use server';
/**
 * @fileOverview Summarizes a conversation.
 *
 * - summarizeConversation - A function that summarizes a conversation.
 * - SummarizeConversationInput - The input type for the summarizeConversation function.
 * - SummarizeConversationOutput - The return type for the summarizeConversation function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SummarizeConversationInputSchema = z.object({
  conversation: z.string().describe('The conversation to summarize.'),
});
export type SummarizeConversationInput = z.infer<typeof SummarizeConversationInputSchema>;

const SummarizeConversationOutputSchema = z.object({
  summary: z.string().describe('The summary of the conversation.'),
});
export type SummarizeConversationOutput = z.infer<typeof SummarizeConversationOutputSchema>;

export async function summarizeConversation(input: SummarizeConversationInput): Promise<SummarizeConversationOutput> {
  return summarizeConversationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeConversationPrompt',
  input: {
    schema: z.object({
      conversation: z.string().describe('The conversation to summarize.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('The summary of the conversation.'),
    }),
  },
  prompt: `You are an AI assistant tasked with summarizing conversations.

  Summarize the following conversation:
  {{conversation}}
  `,
});

const summarizeConversationFlow = ai.defineFlow<
  typeof SummarizeConversationInputSchema,
  typeof SummarizeConversationOutputSchema
>(
  {
    name: 'summarizeConversationFlow',
    inputSchema: SummarizeConversationInputSchema,
    outputSchema: SummarizeConversationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

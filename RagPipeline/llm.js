import { OpenAI } from 'openai';

console.log("API Key", process.env.GOOGLE_API_KEY);


export const client = new OpenAI({
    apiKey: process.env.GOOGLE_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

export async function chatOnce({ model, messages, max_tokens = 400, temperature = 0.3 }) {
    const res = await client.chat.completions.create({
        model,
        messages,
        max_tokens,
        temperature
    });

    return res.choices[0]?.message?.content ?? '';
}
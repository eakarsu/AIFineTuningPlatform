const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

async function callOpenRouter(prompt, systemPrompt = 'You are an AI assistant specialized in machine learning, fine-tuning, and MLOps. Provide detailed, actionable responses.') {
  try {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ai-finetuning-platform.com',
          'X-Title': 'AI Fine-Tuning Platform',
        },
      }
    );

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return {
        content: response.data.choices[0].message.content,
        model: response.data.model,
        usage: response.data.usage,
      };
    }

    throw new Error('No response from OpenRouter');
  } catch (err) {
    if (err.response) {
      throw new Error(`OpenRouter API error: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
}

module.exports = { callOpenRouter };

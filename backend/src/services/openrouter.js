const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

async function callOpenRouter(prompt, systemPrompt = 'You are an AI assistant specialized in machine learning, fine-tuning, and MLOps. Provide detailed, actionable responses.', options = {}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY env var is required');
  }
  const { temperature = 0.7, maxTokens = 2000, model = OPENROUTER_MODEL } = options;
  try {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://ai-finetuning-platform.com',
          'X-Title': 'AI Fine-Tuning Platform',
        },
        timeout: 60_000,
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

/**
 * Robust 3-strategy JSON parser for LLM responses.
 *  1. Strip ```json fences and parse.
 *  2. Find first {...} block via regex.
 *  3. Find first [...] block via regex.
 * Returns null on total failure.
 */
function parseAIJson(text) {
  if (!text || typeof text !== 'string') return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try { return JSON.parse(fence[1].trim()); } catch (_) {}
  }
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) {
    try { return JSON.parse(obj[0]); } catch (_) {}
  }
  const arr = text.match(/\[[\s\S]*\]/);
  if (arr) {
    try { return JSON.parse(arr[0]); } catch (_) {}
  }
  try { return JSON.parse(text.trim()); } catch (_) { return null; }
}

module.exports = { callOpenRouter, parseAIJson, OPENROUTER_MODEL };

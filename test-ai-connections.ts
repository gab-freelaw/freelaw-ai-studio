import * as dotenv from 'dotenv';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { generateText } from 'ai';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testAIConnections() {
  console.log('🧪 Testing AI Provider Connections...\n');
  
  const testPrompt = 'Say "Hello from Freelaw AI" in Portuguese (just the greeting, nothing else)';
  let successCount = 0;
  let failCount = 0;
  
  // Test OpenAI
  console.log('1. Testing OpenAI...');
  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: testPrompt,
      maxTokens: 20,
    });
    console.log('✅ OpenAI: Connected -', result.text.trim());
    successCount++;
  } catch (error: any) {
    console.log('❌ OpenAI: Failed -', error.message);
    failCount++;
  }
  
  // Test Anthropic
  console.log('\n2. Testing Anthropic...');
  try {
    const result = await generateText({
      model: anthropic('claude-3-haiku-20240307'),
      prompt: testPrompt,
      maxTokens: 20,
    });
    console.log('✅ Anthropic: Connected -', result.text.trim());
    successCount++;
  } catch (error: any) {
    console.log('❌ Anthropic: Failed -', error.message);
    failCount++;
  }
  
  // Test Google Gemini
  console.log('\n3. Testing Google Gemini...');
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    console.log('✅ Gemini: Connected -', response.text().trim());
    successCount++;
  } catch (error: any) {
    console.log('❌ Gemini: Failed -', error.message);
    failCount++;
  }
  
  // Test Groq
  console.log('\n4. Testing Groq...');
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: testPrompt }],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 20,
    });
    console.log('✅ Groq: Connected -', completion.choices[0]?.message?.content?.trim());
    successCount++;
  } catch (error: any) {
    console.log('❌ Groq: Failed -', error.message);
    failCount++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${successCount} working, ${failCount} failed`);
  
  if (successCount === 4) {
    console.log('🎉 All AI providers are connected and working!');
  } else if (successCount > 0) {
    console.log('⚠️  Some providers are not working. Check the API keys above.');
  } else {
    console.log('❌ No providers are working. Please check all API keys.');
  }
}

testAIConnections().catch(console.error);
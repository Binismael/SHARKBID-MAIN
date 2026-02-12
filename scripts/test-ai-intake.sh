#!/bin/bash

# Test AI Intake Endpoint

echo "🔍 Testing AI Intake API..."
echo ""

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ OPENAI_API_KEY is not set in environment variables"
  echo ""
  echo "Please set it with:"
  echo "  export OPENAI_API_KEY='sk-proj-...'"
  exit 1
fi

echo "✅ OPENAI_API_KEY is configured"
echo ""

# Check if dev server is running
echo "🔌 Checking if dev server is running on port 8080..."
if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
  echo "⚠️  Dev server not responding on localhost:8080"
  echo "   Make sure to run: pnpm dev"
  echo ""
fi

# Test the API endpoint
echo "📤 Testing /api/ai-intake endpoint..."
echo ""

RESPONSE=$(curl -X POST http://localhost:8080/api/ai-intake \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "I need payroll services",
    "conversationHistory": [],
    "systemPrompt": "You are a helpful assistant"
  }' 2>/dev/null)

echo "Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# Check response status
if echo "$RESPONSE" | grep -q '"error"'; then
  echo "❌ API returned an error"
  echo ""
  echo "Possible causes:"
  echo "  1. OPENAI_API_KEY is invalid"
  echo "  2. OpenAI API quota exceeded"
  echo "  3. Network issue"
  exit 1
elif echo "$RESPONSE" | grep -q '"response"'; then
  echo "✅ API working correctly!"
else
  echo "⚠️  Unexpected response format"
fi

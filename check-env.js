#!/usr/bin/env node

/**
 * Quick environment variable check for Sharkbid
 * Run: node check-env.js
 */

console.log('🔍 Checking Sharkbid Environment Setup...\n');

const required = [
  'OPENAI_API_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

const optional = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SENDGRID_API_KEY',
];

let allGood = true;

console.log('📋 Required Variables:');
required.forEach(key => {
  const value = process.env[key];
  if (value) {
    const masked = value.substring(0, 10) + '...' + value.substring(value.length - 5);
    console.log(`  ✅ ${key}: ${masked}`);
  } else {
    console.log(`  ❌ ${key}: NOT SET`);
    allGood = false;
  }
});

console.log('\n📋 Optional Variables:');
optional.forEach(key => {
  const value = process.env[key];
  if (value) {
    const masked = value.substring(0, 10) + '...';
    console.log(`  ✅ ${key}: ${masked}`);
  } else {
    console.log(`  ⚠️  ${key}: not set`);
  }
});

console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ Environment is properly configured!');
  console.log('\nYou can now run: pnpm dev');
} else {
  console.log('❌ Missing required environment variables!');
  console.log('\nPlease set them in your .env file or shell:');
  console.log('  export OPENAI_API_KEY="sk-proj-..."');
  console.log('  export VITE_SUPABASE_URL="https://..."');
  console.log('  export VITE_SUPABASE_ANON_KEY="..."');
  process.exit(1);
}

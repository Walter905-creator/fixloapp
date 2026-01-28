// Fixlo SEO Domination Agent - Entry Point
// This file decides WHAT MODE runs (daily or weekly)
// NO UI - Backend only, autonomous operation

const { runDaily } = require('./daily');
const { runWeekly } = require('./weekly');

const mode = process.argv[2];

async function main() {
  console.log(`🤖 Fixlo SEO Agent starting in ${mode} mode...`);
  
  try {
    if (mode === 'daily') {
      await runDaily();
      console.log('✅ Daily SEO agent run completed successfully');
    } else if (mode === 'weekly') {
      await runWeekly();
      console.log('✅ Weekly SEO agent run completed successfully');
    } else {
      throw new Error('Invalid SEO agent mode. Use "daily" or "weekly"');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ SEO Agent failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

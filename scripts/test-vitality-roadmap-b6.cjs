// Explicit opt-in to local fictional B6, retaining B4/B4.2/B5 and production regressions.
if(process.env.RVA_ROADMAP_B4_LOCAL!=='1')throw Error('B6 tests require explicit local PostgreSQL17 mode');
process.env.RVA_B6_LOCAL='1';require('./test-vitality-roadmap-b5.cjs');

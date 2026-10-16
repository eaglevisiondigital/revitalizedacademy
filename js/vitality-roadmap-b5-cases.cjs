// Retain all 30 B2 and 20 B2.1 fictional measurement sheets, unchanged.
const data=require('./vitality-roadmap-b21-scenarios.js');
module.exports=Object.freeze([...data.legacyCases,...data.cases]);

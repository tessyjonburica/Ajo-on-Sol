const fs = require('fs');
const path = require('path');

/**
 * This script creates a fixed version of the Ajo IDL for use in the frontend
 * The main issue was case sensitivity in enum variants
 */

// Get the original IDL
const originalIdlPath = path.join(__dirname, 'ajo-idl.json');
const originalIdl = JSON.parse(fs.readFileSync(originalIdlPath, 'utf-8'));

// Get our working minimal IDL
const minimalIdlPath = path.join(__dirname, 'minimal-ajo-idl.json');
const minimalIdl = JSON.parse(fs.readFileSync(minimalIdlPath, 'utf-8'));

// Create a combined IDL with proper casing
const fixedIdl = {
  ...originalIdl,
  // Replace the types section with our fixed lowercase enum variants
  types: minimalIdl.types
};

// Save the fixed IDL
const outputPath = path.join(__dirname, 'fixed-ajo-idl.json');
fs.writeFileSync(outputPath, JSON.stringify(fixedIdl, null, 2));
console.log(`Fixed IDL saved to: ${outputPath}`);

// Update the server.ts and ajo-contract.ts files
const serverPath = path.join(__dirname, 'server.ts');
const contractPath = path.join(__dirname, 'ajo-contract.ts');

// Read files
let serverContent = fs.readFileSync(serverPath, 'utf-8');
let contractContent = fs.readFileSync(contractPath, 'utf-8');

// Replace SOL with sol and Weekly/Monthly with weekly/monthly
// For server.ts - already done manually, this is a double-check
serverContent = serverContent
  .replace(/{ SOL: {} }/g, '{ sol: {} }')
  .replace(/{ USDC: {} }/g, '{ usdc: {} }')
  .replace(/\[cyclePeriod === "weekly" \? "Weekly" : "Monthly"\]/g, '[cyclePeriod === "weekly" ? "weekly" : "monthly"]');

// For ajo-contract.ts (this one is still using camelCase)
contractContent = contractContent
  .replace(/{ SOL: {} }/g, '{ sol: {} }')
  .replace(/{ USDC: {} }/g, '{ usdc: {} }')
  .replace(/{ Weekly: {} }/g, '{ weekly: {} }')
  .replace(/{ Monthly: {} }/g, '{ monthly: {} }');

// Write the updated files
fs.writeFileSync(serverPath, serverContent);
console.log(`Updated server.ts with fixed enum formatting`);

fs.writeFileSync(contractPath, contractContent);
console.log(`Updated ajo-contract.ts with fixed enum formatting`);

// Inform about what to do next
console.log('\nNext steps:');
console.log('1. In your code, update all imports to use the fixed IDL:');
console.log('   import * as ajoIdl from "./fixed-ajo-idl.json"');
console.log('2. When using enums in your code, use lowercase: { sol: {} } and { monthly: {} }');
console.log('3. Make sure PDA derivations match between frontend and program');
console.log('4. Test thoroughly with devnet before moving to production'); 
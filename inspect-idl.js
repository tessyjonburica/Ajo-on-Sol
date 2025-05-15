const fs = require('fs');

// Load IDL from file
const idl = JSON.parse(fs.readFileSync('./lib/solana/ajo-idl.json', 'utf-8'));

console.log('IDL Structure:');
console.log('==============');
console.log('Program ID:', idl.address);
console.log('Instructions:', idl.instructions.map(i => i.name));

// Examine the create_pool instruction
const createPoolInstruction = idl.instructions.find(i => i.name === 'create_pool');
if (createPoolInstruction) {
  console.log('\nCreate Pool Instruction:');
  console.log('=======================');
  
  console.log('Arguments:');
  createPoolInstruction.args.forEach((arg, index) => {
    if (typeof arg.type === 'object' && arg.type.defined) {
      console.log(`  [${index}] ${arg.name}: (defined type) ${JSON.stringify(arg.type)}`);
    } else {
      console.log(`  [${index}] ${arg.name}: ${typeof arg.type === 'object' ? JSON.stringify(arg.type) : arg.type}`);
    }
  });
  
  console.log('\nAccounts:');
  createPoolInstruction.accounts.forEach((account, index) => {
    console.log(`  [${index}] ${account.name} (writable: ${account.writable || false})`);
  });
}

// Inspect the Types
console.log('\nTypes:');
console.log('======');
if (idl.types) {
  idl.types.forEach((type, index) => {
    console.log(`[${index}] ${type.name}:`);
    if (type.type.kind === 'enum') {
      console.log(`  Enum variants: ${JSON.stringify(type.type.variants)}`);
    } else if (type.type.kind === 'struct') {
      console.log(`  Struct fields: ${type.type.fields.map(f => f.name).join(', ')}`);
    }
  });
} else {
  console.log('No types defined in IDL');
}

// Check exact format of CurrencyType and CyclePeriod
const currencyType = idl.types?.find(t => t.name === 'CurrencyType');
const cyclePeriod = idl.types?.find(t => t.name === 'CyclePeriod');

console.log('\nCurrencyType Details:');
console.log('====================');
console.log(JSON.stringify(currencyType, null, 2));

console.log('\nCyclePeriod Details:');
console.log('==================');
console.log(JSON.stringify(cyclePeriod, null, 2)); 
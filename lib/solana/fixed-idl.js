const fs = require('fs');
const path = require('path');

// Read the original IDL
const idlPath = path.join(__dirname, '..', '..', 'lib', 'solana', 'ajo-idl.json');
const rawIdl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));

// Fix the IDL structure
function fixIdl(idl) {
  // Create a deep copy to not mutate the original
  const fixedIdl = JSON.parse(JSON.stringify(idl));
  
  // Fix instructions
  if (fixedIdl.instructions) {
    fixedIdl.instructions.forEach(instruction => {
      // Fix args - normalize field names
      if (instruction.args) {
        instruction.args.forEach(arg => {
          // Convert snake_case to camelCase
          const camelCaseName = arg.name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          arg.camelName = camelCaseName;
          
          // Special handling for fields that use defined types
          if (typeof arg.type === 'object' && arg.type.defined) {
            if (arg.name === 'currency') {
              console.log(`Fixing field '${arg.name}' in instruction '${instruction.name}'`);
              arg.typeName = 'currencyType';  // Use exact type name from Rust
            } else if (arg.name === 'cycle_period') {
              console.log(`Fixing field '${arg.name}' in instruction '${instruction.name}'`);
              arg.typeName = 'cyclePeriod';  // Use exact type name from Rust
            }
          }
        });
      }
    });
  }

  // Fix types - ensure they match the Rust camelCase names
  if (fixedIdl.types) {
    fixedIdl.types.forEach(type => {
      // Convert type names to camelCase
      if (type.name === 'CurrencyType') {
        type.name = 'currencyType';
        console.log('Fixed CurrencyType -> currencyType');
        
        // Convert enum variant names
        if (type.type.kind === 'enum' && type.type.variants) {
          type.type.variants.forEach(variant => {
            if (variant.name === 'SOL') {
              variant.name = 'sol';
              console.log('Fixed SOL -> sol');
            } else if (variant.name === 'USDC') {
              variant.name = 'usdc';
              console.log('Fixed USDC -> usdc');
            }
          });
        }
      } else if (type.name === 'CyclePeriod') {
        type.name = 'cyclePeriod';
        console.log('Fixed CyclePeriod -> cyclePeriod');
        
        // Convert enum variant names
        if (type.type.kind === 'enum' && type.type.variants) {
          type.type.variants.forEach(variant => {
            if (variant.name === 'Weekly') {
              variant.name = 'weekly';
              console.log('Fixed Weekly -> weekly');
            } else if (variant.name === 'Monthly') {
              variant.name = 'monthly';
              console.log('Fixed Monthly -> monthly');
            }
          });
        }
      }
    });
  }
  
  return fixedIdl;
}

// Fix the IDL
const fixedIdl = fixIdl(rawIdl);

// Output the fixed IDL
console.log("\nFixed IDL structure:");
console.log("===================");
console.log(JSON.stringify(fixedIdl, null, 2));

// Save the fixed IDL
const outputPath = path.join(__dirname, '..', '..', 'lib', 'solana', 'fixed-ajo-idl.json');
fs.writeFileSync(outputPath, JSON.stringify(fixedIdl, null, 2));
console.log(`\nFixed IDL saved to: ${outputPath}`); 
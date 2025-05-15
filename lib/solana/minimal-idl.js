const fs = require('fs');
const path = require('path');

// Create a minimal IDL that only contains what we need for testing
const minimalIdl = {
  version: "0.1.0",
  name: "ajo",
  instructions: [
    {
      name: "createPool",
      accounts: [
        { name: "pool", isMut: true, isSigner: false },
        { name: "member", isMut: true, isSigner: false },
        { name: "vault", isMut: true, isSigner: false },
        { name: "creator", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "poolId", type: "u64" },
        { name: "currency", type: { defined: "currencyType" } },
        { name: "contributionAmount", type: "u64" },
        { name: "totalMembers", type: "u8" },
        { name: "totalCycles", type: "u8" },
        { name: "cyclePeriod", type: { defined: "cyclePeriod" } },
        { name: "creatorPosition", type: "u8" },
        { name: "bump", type: "u8" }
      ]
    }
  ],
  types: [
    {
      name: "currencyType",
      type: {
        kind: "enum",
        variants: [
          { name: "sol" },
          { name: "usdc" }
        ]
      }
    },
    {
      name: "cyclePeriod",
      type: {
        kind: "enum",
        variants: [
          { name: "weekly" },
          { name: "monthly" }
        ]
      }
    }
  ]
};

// Output the minimal IDL
console.log("\nMinimal IDL structure:");
console.log("====================");
console.log(JSON.stringify(minimalIdl, null, 2));

// Save the minimal IDL
const outputPath = path.join(__dirname, '..', '..', 'lib', 'solana', 'minimal-ajo-idl.json');
fs.writeFileSync(outputPath, JSON.stringify(minimalIdl, null, 2));
console.log(`\nMinimal IDL saved to: ${outputPath}`); 
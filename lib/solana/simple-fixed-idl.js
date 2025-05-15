const fs = require('fs');
const path = require('path');

// Read the original IDL
const idlPath = path.join(__dirname, '..', '..', 'lib', 'solana', 'ajo-idl.json');
const rawIdl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));

// Create a completely new, simplified version of the IDL
const fixedIdl = {
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
    },
    {
      name: "executePayout",
      accounts: [
        { name: "pool", isMut: true, isSigner: false },
        { name: "recipient", isMut: true, isSigner: false },
        { name: "recipientWallet", isMut: true, isSigner: false },
        { name: "vault", isMut: true, isSigner: false },
        { name: "vaultToken", isMut: true, isSigner: false, optional: true },
        { name: "recipientToken", isMut: true, isSigner: false, optional: true },
        { name: "tokenProgram", isMut: false, isSigner: false, optional: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: "joinPool",
      accounts: [
        { name: "pool", isMut: true, isSigner: false },
        { name: "member", isMut: true, isSigner: false },
        { name: "user", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "payoutPosition", type: "u8" },
        { name: "questionnaireAnswers", type: { vec: "string" } }
      ]
    },
    {
      name: "makeContribution",
      accounts: [
        { name: "pool", isMut: true, isSigner: false },
        { name: "member", isMut: true, isSigner: false },
        { name: "user", isMut: true, isSigner: true },
        { name: "vault", isMut: true, isSigner: false },
        { name: "userToken", isMut: true, isSigner: false, optional: true },
        { name: "vaultToken", isMut: true, isSigner: false, optional: true },
        { name: "tokenProgram", isMut: false, isSigner: false, optional: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "memberAccount",
      type: {
        kind: "struct",
        fields: [
          { name: "wallet", type: "pubkey" },
          { name: "pool", type: "pubkey" },
          { name: "hasCollected", type: "bool" },
          { name: "contributionsMade", type: "u8" },
          { name: "payoutPosition", type: "u8" },
          { name: "questionnaireAnswers", type: { vec: "string" } },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "vaultAccount",
      type: {
        kind: "struct",
        fields: [
          { name: "pool", type: "pubkey" },
          { name: "amount", type: "u64" },
          { name: "bump", type: "u8" }
        ]
      }
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
  ],
  errors: rawIdl.errors
};

// Output the fixed IDL
console.log("\nSimplified IDL structure:");
console.log("=========================");
console.log(JSON.stringify(fixedIdl, null, 2));

// Save the fixed IDL
const outputPath = path.join(__dirname, '..', '..', 'lib', 'solana', 'simple-ajo-idl.json');
fs.writeFileSync(outputPath, JSON.stringify(fixedIdl, null, 2));
console.log(`\nSimplified IDL saved to: ${outputPath}`); 
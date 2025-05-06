#!/bin/bash

# Create a directory to package everything
mkdir -p ajo-backend-integration

# Copy the IDL file
cp ajo-idl.json ajo-backend-integration/

# Copy the integration guide
cp ajo-integration-guide.md ajo-backend-integration/

# Copy the example file
cp ajo-example.ts ajo-backend-integration/

# Copy the Anchor.toml file for configuration reference
cp Anchor.toml ajo-backend-integration/

# Create a package.json for dependencies
cat > ajo-backend-integration/package.json << EOF
{
  "name": "ajo-backend-integration",
  "version": "1.0.0",
  "description": "Integration package for Ajo smart contract",
  "dependencies": {
    "@coral-xyz/anchor": "^0.28.0",
    "@solana/web3.js": "^1.78.0",
    "@solana/spl-token": "^0.3.8"
  }
}
EOF

# Create a typescript config file
cat > ajo-backend-integration/tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "strict": true
  },
  "include": ["*.ts", "*.json"],
  "exclude": ["node_modules"]
}
EOF

# Create a README file
cat > ajo-backend-integration/README.md << EOF
# Ajo Smart Contract Integration Package

This package contains everything needed to integrate with the Ajo savings group smart contract deployed on Solana Devnet.

## Contents

- \`ajo-integration-guide.md\` - Detailed integration guide
- \`ajo-idl.json\` - The Interface Definition Language file describing the contract
- \`ajo-example.ts\` - Example code showing how to connect to the contract
- \`Anchor.toml\` - Configuration reference
- \`package.json\` - Required dependencies
- \`tsconfig.json\` - TypeScript configuration

## Quick Start

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Read the integration guide for detailed instructions.

3. Modify the example file as needed for your implementation.

## Program ID

The contract is deployed at: \`yJXNfdHJuwQstu9qYhLN5Baa2tGUxSoMYbijkGUxtaH\` on Solana Devnet.
EOF

# Create a ZIP archive
zip -r ajo-backend-integration.zip ajo-backend-integration

echo "Backend integration package created: ajo-backend-integration.zip"
echo "You can now send this package to your backend developer." 
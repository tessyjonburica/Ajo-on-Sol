# Ajo Savings Group - Smart Contract Integration Guide

## Overview

The Ajo smart contract implements a traditional rotating savings group ("Ajo" or "Esusu") on Solana blockchain. It allows users to create pools, join pools, make contributions, and receive payouts in a predetermined order.

## Contract Information

- **Program ID**: `yJXNfdHJuwQstu9qYhLN5Baa2tGUxSoMYbijkGUxtaH`
- **Network**: Solana Devnet
- **Explorer Link**: [View on Solana Explorer](https://explorer.solana.com/address/yJXNfdHJuwQstu9qYhLN5Baa2tGUxSoMYbijkGUxtaH?cluster=devnet)

## Key Features

1. **Pool Creation**: Users can create a new savings pool with custom parameters
2. **Member Management**: Members can join pools and select their payout position
3. **Contribution System**: Members make regular contributions (weekly/monthly)
4. **Automatic Payouts**: Members receive payouts in their selected position order
5. **Support for SOL & SPL Tokens**: Works with native SOL or SPL tokens like USDC

## Integration Steps

### 1. Setup

Install required dependencies:

```bash
npm install @solana/web3.js @coral-xyz/anchor @solana/spl-token
```

### 2. Initialization

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { IDL } from "./ajo"; // Import the IDL JSON

// Initialize connection
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Set up provider with wallet
const wallet = /* wallet implementation */;
const provider = new anchor.AnchorProvider(connection, wallet, {});

// Initialize program
const programId = new PublicKey("yJXNfdHJuwQstu9qYhLN5Baa2tGUxSoMYbijkGUxtaH");
const program = new Program(IDL, programId, provider);
```

### 3. Key Functions

#### Creating a Pool

```typescript
async function createPool(
  creator,
  contributionAmount,
  totalMembers,
  totalCycles,
  cyclePeriod,
  creatorPosition
) {
  const poolId = new anchor.BN(Date.now());
  
  // Find PDAs
  const [poolAccount, poolBump] = await PublicKey.findProgramAddress(
    [
      Buffer.from("pool"),
      creator.publicKey.toBuffer(),
      poolId.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );
  
  const [memberAccount] = await PublicKey.findProgramAddress(
    [
      Buffer.from("member"),
      poolAccount.toBuffer(),
      creator.publicKey.toBuffer(),
    ],
    program.programId
  );
  
  const [vaultAccount] = await PublicKey.findProgramAddress(
    [Buffer.from("vault"), poolAccount.toBuffer()],
    program.programId
  );
  
  // Create pool transaction
  await program.methods
    .createPool(
      poolId,
      { sol: {} }, // or { usdc: {} } for USDC
      new anchor.BN(contributionAmount),
      totalMembers,
      totalCycles,
      cyclePeriod === "weekly" ? { weekly: {} } : { monthly: {} },
      creatorPosition,
      poolBump
    )
    .accounts({
      pool: poolAccount,
      member: memberAccount,
      vault: vaultAccount,
      creator: creator.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([creator])
    .rpc();
    
  return poolAccount;
}
```

#### Joining a Pool

```typescript
async function joinPool(
  user,
  poolAccount,
  payoutPosition,
  questionnaireAnswers
) {
  const [memberAccount] = await PublicKey.findProgramAddress(
    [
      Buffer.from("member"),
      poolAccount.toBuffer(),
      user.publicKey.toBuffer(),
    ],
    program.programId
  );
  
  await program.methods
    .joinPool(
      payoutPosition,
      questionnaireAnswers
    )
    .accounts({
      pool: poolAccount,
      member: memberAccount,
      user: user.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([user])
    .rpc();
    
  return memberAccount;
}
```

#### Making a Contribution

```typescript
async function makeContribution(
  user,
  poolAccount,
  currencyType = "sol"
) {
  const [memberAccount] = await PublicKey.findProgramAddress(
    [
      Buffer.from("member"),
      poolAccount.toBuffer(),
      user.publicKey.toBuffer(),
    ],
    program.programId
  );
  
  const [vaultAccount] = await PublicKey.findProgramAddress(
    [Buffer.from("vault"), poolAccount.toBuffer()],
    program.programId
  );
  
  // Setup accounts based on currency type
  const accounts = {
    pool: poolAccount,
    member: memberAccount,
    user: user.publicKey,
    vault: vaultAccount,
    systemProgram: anchor.web3.SystemProgram.programId,
  };
  
  // Add token accounts if using SPL tokens
  if (currencyType !== "sol") {
    const userToken = /* get token account */;
    const vaultToken = /* get vault token account */;
    
    accounts.userToken = userToken;
    accounts.vaultToken = vaultToken;
    accounts.tokenProgram = TOKEN_PROGRAM_ID;
  } else {
    accounts.userToken = null;
    accounts.vaultToken = null;
    accounts.tokenProgram = null;
  }
  
  await program.methods
    .makeContribution()
    .accounts(accounts)
    .signers([user])
    .rpc();
}
```

#### Fetching Pool Details

```typescript
async function getPoolDetails(poolAccount) {
  const poolData = await program.account.poolAccount.fetch(poolAccount);
  return poolData;
}
```

### 4. Account Structure

#### Pool Account
```typescript
type PoolAccount = {
  creator: PublicKey;
  poolId: BN;
  currency: { sol: {} } | { usdc: {} };
  contributionAmount: BN;
  totalMembers: number;
  memberCount: number;
  memberPubkeys: PublicKey[];
  payoutOrder: [PublicKey, number][];
  currentCycle: number;
  totalCycles: number;
  cyclePeriod: { weekly: {} } | { monthly: {} };
  lastContributionTime: BN;
  active: boolean;
  bump: number;
};
```

#### Member Account
```typescript
type MemberAccount = {
  wallet: PublicKey;
  pool: PublicKey;
  hasCollected: boolean;
  contributionsMade: number;
  payoutPosition: number;
  questionnaireAnswers: string[];
  bump: number;
};
```

## Error Handling

The contract can return the following errors:

- `PoolFull`: Attempted to join a pool that already has all members
- `PoolNotActive`: Attempted to contribute to an inactive pool
- `ContributionAlreadyMade`: Attempted to contribute twice in the same cycle
- `PositionAlreadyTaken`: Attempted to select a position already taken by another member
- `UserNotInPool`: User is not a member of the pool

## Testing

We recommend testing your integration on Devnet first. You can use the Solana Explorer to view transactions and account data:
https://explorer.solana.com/?cluster=devnet

## Deployment to Mainnet

Once testing is complete, we'll deploy to Mainnet with an updated Program ID. 
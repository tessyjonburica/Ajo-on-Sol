/**
 * Final verification test for the Solana program integration
 */
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const anchor = require('@project-serum/anchor');
const fs = require('fs');

// Load the fixed IDL
const idl = JSON.parse(fs.readFileSync('./lib/solana/fixed-ajo-idl.json', 'utf-8'));

// Helper functions for PDAs
const findPoolPDA = (
  poolId,
  creatorPublicKey,
  programId
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      creatorPublicKey.toBuffer(),
      new anchor.BN(poolId).toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
};

const findMemberPDA = (
  poolAccount,
  memberPublicKey,
  programId
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("member"),
      poolAccount.toBuffer(),
      memberPublicKey.toBuffer(),
    ],
    programId
  );
};

const findVaultPDA = (poolAccount, programId) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), poolAccount.toBuffer()],
    programId
  );
};

// Main test function
async function verifyIntegration() {
  try {
    // Load keypair from file if available
    let keypair;
    if (fs.existsSync('/Users/favourolaboye/.config/solana/id.json')) {
      try {
        const secretKey = JSON.parse(
          fs.readFileSync('/Users/favourolaboye/.config/solana/id.json', 'utf-8')
        );
        keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
        console.log("Using wallet from Solana config:", keypair.publicKey.toBase58());
      } catch (err) {
        console.error("Error loading keypair from config:", err);
        keypair = Keypair.generate();
        console.log("Using fallback test keypair:", keypair.publicKey.toBase58());
      }
    } else {
      keypair = Keypair.generate();
      console.log("Using test keypair:", keypair.publicKey.toBase58());
    }

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const programId = new PublicKey('EiKhShgBVKz8bNY4eqAxQByS6CvsCeKVavxFhba38QFk');
    
    // Create provider with wallet
    const provider = new anchor.AnchorProvider(
      connection,
      {
        publicKey: keypair.publicKey,
        signTransaction: async (tx) => {
          tx.partialSign(keypair);
          return tx;
        },
        signAllTransactions: async (txs) => {
          return txs.map((tx) => {
            tx.partialSign(keypair);
            return tx;
          });
        },
      },
      { commitment: 'confirmed', preflightCommitment: 'processed' }
    );
    
    // Create program with fixed IDL
    const program = new anchor.Program(idl, programId, provider);
    
    // Check balance before proceeding
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`Wallet balance: ${balance / 10**9} SOL`);
    
    if (balance < 10000000) { // 0.01 SOL minimum
      console.error("Insufficient balance to run test");
      console.error("Please fund your wallet manually via https://faucet.solana.com");
      process.exit(1);
    }
    
    // Generate a unique pool ID and find PDAs
    const poolId = Date.now();
    const [poolAccount, poolBump] = findPoolPDA(poolId, keypair.publicKey, programId);
    const [memberAccount] = findMemberPDA(poolAccount, keypair.publicKey, programId);
    const [vaultAccount] = findVaultPDA(poolAccount, programId);
    
    // Create pool with lowercase enum format
    console.log("Creating pool with ID:", poolId);
    const contributionAmount = 0.1; // 0.1 SOL
    const contributionAmountLamports = contributionAmount * 10 ** 9;
    
    console.log("\nSending transaction with these parameters:");
    console.log("- Pool ID:", poolId);
    console.log("- Currency: { sol: {} }");  // IMPORTANT: lowercase
    console.log("- Contribution Amount:", contributionAmountLamports);
    console.log("- Total Members:", 5);
    console.log("- Total Cycles:", 10);
    console.log("- Cycle Period: { monthly: {} }");  // IMPORTANT: lowercase
    console.log("- Creator Position:", 1);
    
    const tx = await program.methods
      .createPool(
        new anchor.BN(poolId),
        { sol: {} },  // IMPORTANT: lowercase for enum variant
        new anchor.BN(contributionAmountLamports),
        5, // totalMembers
        10, // totalCycles
        { monthly: {} },  // IMPORTANT: lowercase for enum variant
        1, // creatorPosition
        poolBump
      )
      .accounts({
        pool: poolAccount,
        member: memberAccount,
        vault: vaultAccount,
        creator: keypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();
      
    console.log("\n✅ VERIFICATION SUCCESSFUL!");
    console.log("Transaction signature:", tx);
    console.log("Pool address:", poolAccount.toBase58());
    console.log("View on Solana Explorer:", `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    
    console.log("\n🎉 Your Solana program is now properly connected to the frontend!");
    console.log("\nFIXES APPLIED:");
    console.log("1. Fixed the IDL format with proper enum casing (lowercase)");
    console.log("2. Updated enum usage in server.ts and ajo-contract.ts");
    console.log("3. Created fixed-ajo-idl.json for use in all imports");
    
    console.log("\nNEXT STEPS:");
    console.log("1. Update any other files that import the IDL directly");
    console.log("2. Always use lowercase enum variants: { sol: {} } and { monthly: {} }");
    console.log("3. Upload the fixed IDL to the chain using:");
    console.log("   anchor idl upgrade --filepath ./lib/solana/fixed-ajo-idl.json --provider.cluster devnet EiKhShgBVKz8bNY4eqAxQByS6CvsCeKVavxFhba38QFk");
  } catch (err) {
    console.error("Verification failed:", err);
    if (err.logs) {
      console.error("Transaction logs:");
      err.logs.forEach((log, i) => console.error(`${i}: ${log}`));
    }
  }
}

// Run the verification
verifyIntegration(); 
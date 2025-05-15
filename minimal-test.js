const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const anchor = require('@project-serum/anchor');
const fs = require('fs');

// Helper function to find PDAs
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

async function test() {
  // Load minimal IDL from file
  const idl = JSON.parse(fs.readFileSync('./lib/solana/minimal-ajo-idl.json', 'utf-8'));
  
  // Use test keypair for simplicity
  const keypair = Keypair.generate();
  console.log("Using test keypair:", keypair.publicKey.toBase58());

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const programId = new PublicKey('EiKhShgBVKz8bNY4eqAxQByS6CvsCeKVavxFhba38QFk');
  
  // Create provider with test keypair
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
    { commitment: 'confirmed' }
  );
  
  // Create program with minimal IDL
  const program = new anchor.Program(idl, programId, provider);
  
  try {
    // Generate a unique pool ID and find PDAs
    const poolId = Date.now();
    const [poolAccount, poolBump] = findPoolPDA(poolId, keypair.publicKey, programId);
    const [memberAccount] = findMemberPDA(poolAccount, keypair.publicKey, programId);
    const [vaultAccount] = findVaultPDA(poolAccount, programId);
    
    // Fund the test wallet (this will fail without sufficient SOL)
    console.log("Requesting airdrop for test wallet...");
    try {
      const airdropSig = await connection.requestAirdrop(
        keypair.publicKey,
        1000000000 // 1 SOL
      );
      await connection.confirmTransaction(airdropSig);
      console.log("Airdrop successful");
    } catch (err) {
      console.warn("Airdrop failed, proceeding anyway:", err.message);
    }
    
    // Create pool with lowercase enum format
    console.log("Creating pool with ID:", poolId);
    const contributionAmount = 0.1; // 0.1 SOL
    const contributionAmountLamports = contributionAmount * 10 ** 9;
    
    // Log all parameters for debugging
    console.log("Transaction Parameters:");
    console.log("- Pool ID:", poolId);
    console.log("- Currency:", { sol: {} });
    console.log("- Contribution Amount:", contributionAmountLamports.toString());
    console.log("- Total Members:", 5);
    console.log("- Total Cycles:", 10);
    console.log("- Cycle Period:", { monthly: {} });
    console.log("- Creator Position:", 1);
    console.log("- Bump:", poolBump);
    
    console.log("Account Addresses:");
    console.log("- Pool:", poolAccount.toBase58());
    console.log("- Member:", memberAccount.toBase58());
    console.log("- Vault:", vaultAccount.toBase58());
    console.log("- Creator:", keypair.publicKey.toBase58());
    
    const tx = await program.methods
      .createPool(
        new anchor.BN(poolId),
        { sol: {} },  // lowercase for fixed IDL
        new anchor.BN(contributionAmountLamports),
        5, // totalMembers
        10, // totalCycles
        { monthly: {} },  // lowercase for fixed IDL
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
      
    console.log("Transaction successful:", tx);
    console.log("Pool created:", poolAccount.toBase58());
  } catch (err) {
    console.error("Error creating pool:", err);
    
    // Attempt to get more detailed error information
    if (err.logs) {
      console.error("Transaction logs:");
      err.logs.forEach((log, i) => console.error(`${i}: ${log}`));
    }
    
    if (err.message) {
      console.error("Error message:", err.message);
    }
    
    // Print inner error if available
    if (err.error && err.error.errorMessage) {
      console.error("Inner error message:", err.error.errorMessage);
    }
  }
}

test(); 
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
  
  // IMPORTANT: Use your actual wallet that has SOL on devnet
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
  
  // Create program with minimal IDL
  const program = new anchor.Program(idl, programId, provider);
  
  try {
    // Check balance before proceeding
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`Wallet balance: ${balance / 10**9} SOL`);
    
    if (balance < 10000000) { // 0.01 SOL minimum
      console.log("Insufficient balance, attempting airdrop...");
      try {
        const airdropSig = await connection.requestAirdrop(
          keypair.publicKey,
          1000000000 // 1 SOL
        );
        await connection.confirmTransaction(airdropSig);
        console.log("Airdrop successful");
      } catch (err) {
        console.error("Airdrop failed:", err.message);
        console.error("Please fund your wallet manually via https://faucet.solana.com");
        process.exit(1);
      }
    }
    
    // Generate a unique pool ID and find PDAs
    const poolId = Date.now();
    const [poolAccount, poolBump] = findPoolPDA(poolId, keypair.publicKey, programId);
    const [memberAccount] = findMemberPDA(poolAccount, keypair.publicKey, programId);
    const [vaultAccount] = findVaultPDA(poolAccount, programId);
    
    // Create pool with correct case for enum names (lowercase)
    console.log("Creating pool with ID:", poolId);
    const contributionAmount = 0.1; // 0.1 SOL
    const contributionAmountLamports = contributionAmount * 10 ** 9;
    
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
      
    console.log("Transaction successful:", tx);
    console.log("Pool created:", poolAccount.toBase58());
    console.log("Check transaction on Solana Explorer:");
    console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);
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
  }
}

test(); 
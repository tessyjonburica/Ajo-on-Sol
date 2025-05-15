import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import fs from 'fs';

// Helper function to find PDAs
const findPoolPDA = (
  poolId: number,
  creatorPublicKey: PublicKey,
  programId: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      creatorPublicKey.toBuffer(),
      new BN(poolId).toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
};

const findMemberPDA = (
  poolAccount: PublicKey,
  memberPublicKey: PublicKey,
  programId: PublicKey
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

const findVaultPDA = (poolAccount: PublicKey, programId: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), poolAccount.toBuffer()],
    programId
  );
};

async function test() {
  // Load IDL from file
  const idl = JSON.parse(fs.readFileSync('./lib/solana/ajo-idl.json', 'utf-8'));

  // Load keypair from file if available
  let keypair: Keypair;
  if (fs.existsSync('/Users/favourolaboye/.config/solana/id.json')) {
    const secretKey = JSON.parse(
      fs.readFileSync('/Users/favourolaboye/.config/solana/id.json', 'utf-8')
    );
    keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
  } else {
    // Generate a new keypair for testing
    keypair = Keypair.generate();
    console.log("Using generated keypair:", keypair.publicKey.toBase58());
  }

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const programId = new PublicKey('EiKhShgBVKz8bNY4eqAxQByS6CvsCeKVavxFhba38QFk');
  
  console.log("Wallet public key:", keypair.publicKey.toBase58());
  
  // Create provider with actual keypair
  const provider = new AnchorProvider(
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
  
  // Create program with local IDL
  const program = new Program(idl as unknown as anchor.Idl, programId, provider);
  
  try {
    // Generate a unique pool ID and find PDAs
    const poolId = Date.now();
    const [poolAccount, poolBump] = findPoolPDA(poolId, keypair.publicKey, programId);
    const [memberAccount] = findMemberPDA(poolAccount, keypair.publicKey, programId);
    const [vaultAccount] = findVaultPDA(poolAccount, programId);
    
    // Create pool with correct enum format
    console.log("Creating pool with ID:", poolId);
    const contributionAmount = 0.1; // 0.1 SOL
    const contributionAmountLamports = contributionAmount * 10 ** 9;
    
    const tx = await program.methods
      .createPool(
        new BN(poolId),
        { sol: {} }, // Correct Anchor enum format
        new BN(contributionAmountLamports),
        5, // totalMembers
        10, // totalCycles
        { monthly: {} }, // Correct Anchor enum format
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
  }
}

test(); 
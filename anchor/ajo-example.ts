// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { Connection, PublicKey, Keypair } from "@solana/web3.js";
// import { IDL } from "./ajo-idl"; // Import the IDL JSON

// // Example of using the Ajo smart contract
// async function main() {
//   // 1. Connect to Devnet
//   const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
//   // 2. Load or create a wallet (for demonstration)
//   // In a real app, you would use a wallet adapter or other auth method
//   const wallet = Keypair.generate(); // Demo only, replace with real wallet
  
//   // 3. Set up provider 
//   const provider = new anchor.AnchorProvider(
//     connection,
//     new anchor.Wallet(wallet),
//     { commitment: "confirmed" }
//   );
  
//   // 4. Initialize program with our deployed program ID
//   const programId = new PublicKey("EiKhShgBVKz8bNY4eqAxQByS6CvsCeKVavxFhba38QFk");
//   const program = new Program(IDL, programId, provider);
  
//   // 5. Examples of key operations (commented out for safety)
  
//   /* Example: Create a new pool
//   const poolId = new anchor.BN(Date.now());
//   const contributionAmount = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL);
//   const totalMembers = 5;
//   const totalCycles = 10;
//   const cyclePeriod = { weekly: {} };
//   const creatorPosition = 1;
  
//   // Find PDAs
//   const [poolAccount, poolBump] = await PublicKey.findProgramAddress(
//     [
//       Buffer.from("pool"),
//       wallet.publicKey.toBuffer(),
//       poolId.toArrayLike(Buffer, "le", 8),
//     ],
//     program.programId
//   );
  
//   // ... create pool code here ...
//   */
  
//   /* Example: Fetch existing pools (using a filter)
//   const creatorFilter = [
//     {
//       memcmp: {
//         offset: 8, // Position of creator field in the account
//         bytes: someUserAddress.toBase58(),
//       },
//     },
//   ];
  
//   const pools = await program.account.poolAccount.all(creatorFilter);
//   console.log("Found pools:", pools.map(p => ({
//     address: p.publicKey.toString(),
//     data: p.account
//   })));
//   */
// }

// main().catch(console.error); 
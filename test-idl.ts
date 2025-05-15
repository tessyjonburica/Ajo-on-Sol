import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';

async function test() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const programId = new PublicKey('EiKhShgBVKz8bNY4eqAxQByS6CvsCeKVavxFhba38QFk');
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: new PublicKey('EiKhShgBVKz8bNY4eqAxQByS6CvsCeKVavxFhba38QFk'),
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    },
    { commitment: 'confirmed' }
  );
  
  try {
    console.log('Fetching IDL from chain...');
    const idlOnChain = await Program.fetchIdl(programId, provider);
    console.log('IDL fetched successfully:', !!idlOnChain);
    if (idlOnChain) {
      console.log('Instructions:', idlOnChain.instructions.map(i => i.name));
      console.log('Types:', idlOnChain.types?.map(t => t.name) || []);
    }
  } catch (err) {
    console.error('Error fetching IDL:', err);
  }
}

test(); 
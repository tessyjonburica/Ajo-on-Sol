/**
 * This test simulates the frontend server calling the Solana program
 * to create a pool, using the exact same flow as the actual app
 */
const { createPoolOnChain } = require('./lib/solana/server.ts');

async function testFrontendFlow() {
  try {
    // Get your wallet address from command line args or use a default
    const creatorWalletAddress = process.argv[2] || 'AB5Wt29Vi8WVUUHuWWmFby6rLw9gEffzbVLmy7icMtYp';

    console.log(`Creating pool with creator: ${creatorWalletAddress}`);
    console.log('---------------------------------------------------');

    // This simulates the frontend server's createPool API call
    const result = await createPoolOnChain(
      'Test Ajo Pool', // Pool name (not used in smart contract)
      0.1, // Contribution amount in SOL
      5, // Total members
      10, // Total cycles
      'monthly', // Cycle period (weekly or monthly)
      1, // Creator position in payout order (1-based)
      creatorWalletAddress // Creator wallet address
    );

    console.log('---------------------------------------------------');
    console.log('Pool Creation Successful!');
    console.log('- Pool Address:', result.poolAddress);
    console.log('- Transaction Signature:', result.txSignature);
    console.log('- Explorer URL:', `https://explorer.solana.com/tx/${result.txSignature}?cluster=devnet`);
    console.log('---------------------------------------------------');
    
    console.log('\nVERIFICATION COMPLETE! Your Solana program is now properly connected to your frontend.');
    console.log('\nNext steps:');
    console.log('1. Make sure all your API endpoints use the fixed IDL and enum casing.');
    console.log('2. Use { sol: {} } and { monthly: {} } (lowercase) when passing enums to the program.');
    console.log('3. Consider uploading the fixed IDL to the chain using:');
    console.log('   anchor idl upgrade --filepath ./lib/solana/fixed-ajo-idl.json --provider.cluster devnet EiKhShgBVKz8bNY4eqAxQByS6CvsCeKVavxFhba38QFk');
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

testFrontendFlow(); 
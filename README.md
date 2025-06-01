# Ajo-on-Sol

Ajo-on-Sol is a decentralized community savings pool application built on the Solana blockchain. It implements the traditional African "Ajo" (rotating savings) system in a trustless, blockchain-based environment.

## Overview

Ajo-on-Sol allows users to create and participate in savings pools where members contribute a fixed amount of SOL periodically. The system automatically manages payouts to members on a rotating basis, ensuring fair and transparent distribution of the pooled funds.

## Tech Stack

- **Frontend:**
  - Next.js 13+ (React Framework)
  - TailwindCSS (Styling)
  - Shadcn/ui (UI Components)
  - @solana/web3.js (Solana Web3 Integration)
  - @project-serum/anchor (Solana Program Framework)

- **Blockchain:**
  - Solana (Blockchain Platform)
  - Anchor Framework (Smart Contract Development)
  - Native SOL (Currency)

## Key Features

- Create and join savings pools
- Automated pool management
- Secure SOL contributions (0.25 SOL per contribution)
- Smart contract-based payouts
- Wallet integration with Phantom and other Solana wallets
- Real-time pool status tracking

## Architecture

### Smart Contract (Program)
- Written in Rust using the Anchor framework
- Manages pool creation, contributions, and payouts
- Uses Program Derived Addresses (PDAs) for secure fund management
- Handles native SOL transfers between participants

### Frontend Application
- Modern React application with server-side rendering
- Secure wallet integration using @solana/wallet-adapter
- Real-time transaction status updates
- Responsive design for mobile and desktop

## How It Works

1. **Pool Creation:**
   - Users can create a new pool by specifying parameters
   - A pool PDA is created to manage the pool's funds
   - Pool configuration is stored on-chain

2. **Contribution Process:**
   - Members connect their Solana wallet
   - Contribute the fixed amount (0.25 SOL)
   - Funds are securely stored in the pool's vault

3. **Payout System:**
   - Automated payouts based on pool rotation
   - Smart contract ensures fair distribution
   - Members receive their share directly to their wallet

## Security Features

- Secure wallet integration
- Program Derived Addresses (PDAs) for fund management
- Smart contract-based security checks
- No custody of funds - all managed by smart contracts

## Getting Started

### Prerequisites
- Node.js 16+
- Solana CLI tools
- Phantom Wallet or other Solana wallet

### Installation

```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Run the development server
npm run dev
```

### Environment Setup

Create a `.env` file with the following:

```env
NEXT_PUBLIC_SOLANA_RPC_HOST=https://api.devnet.solana.com
```

## Development

The application uses the following structure:

```
├── app/                 # Next.js application
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   └── pages/         # Application pages
├── programs/          # Solana programs
└── tests/            # Test files
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Solana Foundation
- Anchor Framework
- Next.js Team
- African Traditional Banking Systems 

# @7n7d/sdk

TypeScript SDK for the **7N7D DeFi protocol** on Arbitrum Sepolia.

Built with [viem](https://viem.sh) — no ethers.js dependency.

## Install

```bash
npm install @7n7d/sdk viem
```

## Quick Start

```ts
import { SevenNSevenD } from '@7n7d/sdk';
import { parseUnits } from 'viem';

const client = new SevenNSevenD({
  rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
  privateKey: '0xYOUR_PRIVATE_KEY',
});

// Check USDC balance
const balance = await client.getUSDCBalance();
console.log('USDC balance:', balance);

// Deposit 100 USDC into the trading vault
const txHash = await client.vault.deposit(parseUnits('100', 6));
console.log('Deposit tx:', txHash);

// Get vault shares
const shares = await client.vault.getShares();
console.log('Vault shares:', shares);

// Buy 7N7D tokens
await client.token.buy(parseUnits('1', 18));

// Stake tokens
await client.token.stake(parseUnits('100', 18));

// Claim staking rewards
await client.token.claimRewards();

// Check agent trading status
const status = await client.getStatus();
console.log('Agent status:', status);
```

## Using an Existing Wallet Client

If you already have a viem `WalletClient`, pass it directly:

```ts
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import { SevenNSevenD } from '@7n7d/sdk';

const walletClient = createWalletClient({
  account: privateKeyToAccount('0x...'),
  chain: arbitrumSepolia,
  transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
});

const client = new SevenNSevenD({
  rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
  walletClient,
});
```

## API Reference

### `new SevenNSevenD(config)`

| Parameter      | Type                | Description                         |
| -------------- | ------------------- | ----------------------------------- |
| `rpcUrl`       | `string`            | Arbitrum Sepolia RPC endpoint       |
| `privateKey`   | `` `0x${string}` `` | Private key (alternative to wallet) |
| `walletClient` | `WalletClient`      | viem wallet client (alternative)    |
| `agentApiUrl`  | `string?`           | Override agent API base URL         |

### Vault Methods

| Method                      | Description                              |
| --------------------------- | ---------------------------------------- |
| `vault.deposit(amount)`     | Deposit USDC (auto-approves if needed)   |
| `vault.withdraw(amount)`    | Withdraw from vault (7-day timelock)     |
| `vault.getShares()`         | Get caller's vault share balance         |

### Token Methods

| Method                      | Description                              |
| --------------------------- | ---------------------------------------- |
| `token.buy(amount)`         | Buy 7N7D tokens with ETH                |
| `token.stake(amount)`       | Stake 7N7D tokens (auto-approves)        |
| `token.unstake(amount)`     | Unstake 7N7D tokens                      |
| `token.claimRewards()`      | Claim accumulated staking rewards        |

### Utility Methods

| Method              | Description                            |
| ------------------- | -------------------------------------- |
| `getUSDCBalance()`  | Get connected wallet's USDC balance    |
| `getStatus()`       | Fetch agent trading status from API    |
| `address`           | Connected wallet address (getter)      |

## Contract Addresses (Arbitrum Sepolia)

| Contract      | Address                                      |
| ------------- | -------------------------------------------- |
| USDC          | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |
| TradingVault  | `0x0000000000000000000000000000000000000001`  |
| 7N7D Token    | `0x0000000000000000000000000000000000000002`  |
| Staking       | `0x0000000000000000000000000000000000000003`  |

> ⚠️ Vault, Token, and Staking addresses are placeholders. Update before mainnet.

## License

MIT

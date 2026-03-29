import type { WalletClient, PublicClient, Chain, Transport, Account } from 'viem';

/** Constructor options — provide either a privateKey or a walletClient */
export type SevenNSevenDConfig =
  | {
      rpcUrl: string;
      privateKey: `0x${string}`;
      walletClient?: never;
      agentApiUrl?: string;
    }
  | {
      rpcUrl: string;
      privateKey?: never;
      walletClient: WalletClient<Transport, Chain, Account>;
      agentApiUrl?: string;
    };

/** Vault namespace */
export interface VaultActions {
  /** Deposit USDC into the trading vault */
  deposit(amount: bigint): Promise<`0x${string}`>;
  /** Withdraw from vault (subject to 7-day timelock) */
  withdraw(amount: bigint): Promise<`0x${string}`>;
  /** Get the caller's vault shares */
  getShares(): Promise<bigint>;
}

/** Token namespace */
export interface TokenActions {
  /** Buy 7N7D tokens */
  buy(amount: bigint): Promise<`0x${string}`>;
  /** Stake 7N7D tokens */
  stake(amount: bigint): Promise<`0x${string}`>;
  /** Unstake 7N7D tokens */
  unstake(amount: bigint): Promise<`0x${string}`>;
  /** Claim staking rewards */
  claimRewards(): Promise<`0x${string}`>;
}

/** Agent trading status returned by the API */
export interface AgentStatus {
  running: boolean;
  pnl?: string;
  positions?: number;
  uptime?: number;
  [key: string]: unknown;
}

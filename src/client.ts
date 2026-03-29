import {
  createPublicClient,
  createWalletClient,
  http,
  getContract,
  parseUnits,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Chain,
  type Account,
  type GetContractReturnType,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';

import { ADDRESSES, DEFAULT_AGENT_API } from './constants.js';
import { erc20Abi, tradingVaultAbi, tokenSaleAbi, stakingAbi } from './abis.js';
import type { SevenNSevenDConfig, VaultActions, TokenActions, AgentStatus } from './types.js';

/**
 * Main SDK client for the 7N7D DeFi protocol.
 *
 * @example
 * ```ts
 * import { SevenNSevenD } from '@7n7d/sdk';
 *
 * const client = new SevenNSevenD({
 *   rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
 *   privateKey: '0x...',
 * });
 *
 * await client.vault.deposit(parseUnits('100', 6)); // 100 USDC
 * ```
 */
export class SevenNSevenD {
  readonly publicClient: PublicClient<Transport, Chain>;
  readonly walletClient: WalletClient<Transport, Chain, Account>;
  readonly vault: VaultActions;
  readonly token: TokenActions;

  private readonly agentApiUrl: string;
  private readonly account: Account;

  constructor(config: SevenNSevenDConfig) {
    // --- Transport & clients ---------------------------------------------------
    const transport = http(config.rpcUrl);

    this.publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport,
    });

    if (config.walletClient) {
      this.walletClient = config.walletClient;
      this.account = config.walletClient.account;
    } else {
      const account = privateKeyToAccount(config.privateKey);
      this.account = account;
      this.walletClient = createWalletClient({
        account,
        chain: arbitrumSepolia,
        transport,
      });
    }

    this.agentApiUrl = config.agentApiUrl ?? DEFAULT_AGENT_API;

    // --- Namespaces ------------------------------------------------------------
    this.vault = this._buildVault();
    this.token = this._buildToken();
  }

  // ── Public helpers ──────────────────────────────────────────────────────────

  /** Get the connected wallet's USDC balance (raw, 6 decimals). */
  async getUSDCBalance(): Promise<bigint> {
    return this.publicClient.readContract({
      address: ADDRESSES.USDC,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [this.account.address],
    });
  }

  /** Fetch agent trading status from the 7N7D API. */
  async getStatus(): Promise<AgentStatus> {
    const res = await fetch(`${this.agentApiUrl}/api/status`);
    if (!res.ok) throw new Error(`Agent API error: ${res.status} ${res.statusText}`);
    return res.json() as Promise<AgentStatus>;
  }

  /** The connected wallet address. */
  get address(): `0x${string}` {
    return this.account.address;
  }

  // ── Private: Vault actions ──────────────────────────────────────────────────

  private _buildVault(): VaultActions {
    const self = this;
    return {
      async deposit(amount: bigint) {
        // Approve USDC spend first
        await self._ensureApproval(ADDRESSES.USDC, ADDRESSES.TRADING_VAULT, amount);

        const hash = await self.walletClient.writeContract({
          address: ADDRESSES.TRADING_VAULT,
          abi: tradingVaultAbi,
          functionName: 'deposit',
          args: [amount],
        });
        await self.publicClient.waitForTransactionReceipt({ hash });
        return hash;
      },

      async withdraw(amount: bigint) {
        const hash = await self.walletClient.writeContract({
          address: ADDRESSES.TRADING_VAULT,
          abi: tradingVaultAbi,
          functionName: 'withdraw',
          args: [amount],
        });
        await self.publicClient.waitForTransactionReceipt({ hash });
        return hash;
      },

      async getShares() {
        return self.publicClient.readContract({
          address: ADDRESSES.TRADING_VAULT,
          abi: tradingVaultAbi,
          functionName: 'sharesOf',
          args: [self.account.address],
        });
      },
    };
  }

  // ── Private: Token actions ──────────────────────────────────────────────────

  private _buildToken(): TokenActions {
    const self = this;
    return {
      async buy(amount: bigint) {
        const hash = await self.walletClient.writeContract({
          address: ADDRESSES.TOKEN_7N7D,
          abi: tokenSaleAbi,
          functionName: 'buy',
          args: [amount],
          value: amount, // ETH payment
        });
        await self.publicClient.waitForTransactionReceipt({ hash });
        return hash;
      },

      async stake(amount: bigint) {
        await self._ensureApproval(ADDRESSES.TOKEN_7N7D, ADDRESSES.STAKING, amount);

        const hash = await self.walletClient.writeContract({
          address: ADDRESSES.STAKING,
          abi: stakingAbi,
          functionName: 'stake',
          args: [amount],
        });
        await self.publicClient.waitForTransactionReceipt({ hash });
        return hash;
      },

      async unstake(amount: bigint) {
        const hash = await self.walletClient.writeContract({
          address: ADDRESSES.STAKING,
          abi: stakingAbi,
          functionName: 'unstake',
          args: [amount],
        });
        await self.publicClient.waitForTransactionReceipt({ hash });
        return hash;
      },

      async claimRewards() {
        const hash = await self.walletClient.writeContract({
          address: ADDRESSES.STAKING,
          abi: stakingAbi,
          functionName: 'claimRewards',
        });
        await self.publicClient.waitForTransactionReceipt({ hash });
        return hash;
      },
    };
  }

  // ── Private: Approval helper ────────────────────────────────────────────────

  private async _ensureApproval(
    tokenAddress: `0x${string}`,
    spender: `0x${string}`,
    amount: bigint,
  ): Promise<void> {
    const allowance = await this.publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [this.account.address, spender],
    });

    if (allowance < amount) {
      const hash = await this.walletClient.writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amount],
      });
      await this.publicClient.waitForTransactionReceipt({ hash });
    }
  }
}

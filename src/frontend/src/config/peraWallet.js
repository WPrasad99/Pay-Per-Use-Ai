/**
 * Shared PeraWallet instance — ONE instance used across the entire app.
 * Prevents multiple WalletConnect sessions from conflicting.
 */
import { PeraWalletConnect } from "@perawallet/connect";

export const peraWallet = new PeraWalletConnect();

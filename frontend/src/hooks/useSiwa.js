/**
 * useSiwa – Sign-In with Algorand hook.
 * Uses the shared peraWallet singleton to avoid multiple WalletConnect sessions.
 */
import { peraWallet } from '../config/peraWallet';
import { authLogout } from '../api/client';

export function useSiwa() {
    /**
     * Sign out: clear JWT cookie (server-side) + disconnect wallet + clear session.
     */
    const signOut = async () => {
        try { await authLogout(); } catch (_) { }
        try {
            if (peraWallet.isConnected) {
                await peraWallet.disconnect();
            }
        } catch (_) { }
        sessionStorage.clear();
    };

    return { signOut };
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** All requests include credentials so the HttpOnly JWT cookie is sent. */
const apiFetch = (url, options = {}) =>
    fetch(url, { credentials: 'include', ...options });

const handleResponse = async (res) => {
    if (!res.ok) {
        let errMessage = "Unknown error occurred";
        try {
            const data = await res.json();
            errMessage = data.detail || JSON.stringify(data);
        } catch (_) { }
        throw new Error(errMessage);
    }
    return res.json();
};

// ── SIWA Auth ────────────────────────────────────────────────

export const getNonce = async (walletAddress) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/auth/nonce?wallet=${walletAddress}`);
    return handleResponse(res);
};

export const verifySiwa = async (walletAddress, message, signature) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress, message, signature }),
    });
    return handleResponse(res);
};

export const authLogout = async () => {
    const res = await apiFetch(`${BASE_URL}/api/v1/auth/logout`, { method: 'POST' });
    return handleResponse(res);
};

// ────────────────────────────────────────────────────────────

export const getServices = async () => {
    const res = await apiFetch(`${BASE_URL}/api/v1/services`);
    return handleResponse(res);
};

export const getPaymentInfo = async (serviceId) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/payment-info/${serviceId}`);
    return handleResponse(res);
};

export const initiatePayment = async (serviceId, walletAddress, prompt) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/payment/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: serviceId, wallet_address: walletAddress, prompt })
    });
    return handleResponse(res);
};

export const submitQuery = async (sessionId, txGroupId) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, tx_group_id: txGroupId })
    });
    return handleResponse(res);
};

export const getHealth = async () => {
    const res = await apiFetch(`${BASE_URL}/health`);
    return handleResponse(res);
};

// ── New Chat API ──

export const streamChat = async (serviceId, walletAddress, prompt, conversationId = null, txId = null) => {
    const body = {
        service_id: serviceId,
        wallet_address: walletAddress,
        prompt
    };
    if (conversationId) body.conversation_id = conversationId;
    if (txId) body.tx_id = txId;

    const res = await apiFetch(`${BASE_URL}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    
    if (!res.ok) {
        let errMessage = "Unknown error occurred";
        try {
            const data = await res.json();
            errMessage = data.detail || JSON.stringify(data);
        } catch (_) { }
        throw new Error(errMessage);
    }
    
    return res;
};

export const sendChat = async (serviceId, walletAddress, prompt, conversationId = null, txId = null) => {
    const body = {
        service_id: serviceId,
        wallet_address: walletAddress,
        prompt
    };
    if (conversationId) body.conversation_id = conversationId;
    if (txId) body.tx_id = txId;

    const res = await apiFetch(`${BASE_URL}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    return handleResponse(res);
};

export const getConversationHistory = async (walletAddress, serviceId = null) => {
    let url = `${BASE_URL}/api/v1/conversations/${walletAddress}`;
    if (serviceId) url += `?service_id=${serviceId}`;
    const res = await apiFetch(url);
    return handleResponse(res);
};

export const getConversationMessages = async (walletAddress, conversationId) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/conversations/${walletAddress}/${conversationId}/messages`);
    return handleResponse(res);
};

export const getWalletPrepayBalance = async (walletAddress) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/wallet/${walletAddress}/balance`);
    return handleResponse(res);
};

export const depositWalletFunds = async (walletAddress, txGroupId) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/wallet/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress, tx_group_id: txGroupId })
    });
    return handleResponse(res);
};

export const generateImage = async (walletAddress, prompt, conversationId = null) => {
    const body = { wallet_address: walletAddress, prompt };
    if (conversationId) body.conversation_id = conversationId;
    const res = await apiFetch(`${BASE_URL}/api/v1/images/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    return handleResponse(res);
};

export const mintNFT = async (walletAddress, imageUrl, prompt) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/images/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: walletAddress, image_url: imageUrl, prompt })
    });
    return handleResponse(res);
};
export const transferNFT = async (walletAddress, assetId) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/images/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: walletAddress, asset_id: assetId })
    });
    return handleResponse(res);
};

export const getUserProfile = async (walletAddress) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/users/${walletAddress}`);
    return handleResponse(res);
};

export const registerUser = async (walletAddress, name, dob, email) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: walletAddress, name, dob, email })
    });
    return handleResponse(res);
};

export const deleteConversation = async (conversationId) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/conversations/${conversationId}`, {
        method: "DELETE"
    });
    return handleResponse(res);
};

export const getUserAnalytics = async (walletAddress) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/users/${walletAddress}/analytics`);
    return handleResponse(res);
};

export const getSessionStatus = async (walletAddress) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/session/${walletAddress}/status`);
    return handleResponse(res);
};

export const getSharedConversation = async (conversationId) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/shared/${conversationId}`);
    return handleResponse(res);
};


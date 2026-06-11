const BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/** All requests include credentials so the HttpOnly JWT cookie is sent, and fall back to Bearer token if available. */
const apiFetch = (url, options = {}) => {
    const headers = { ...(options.headers || {}) };
    const token = localStorage.getItem('auth_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { credentials: 'include', ...options, headers });
};

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
    const data = await handleResponse(res);
    if (data.token) {
        localStorage.setItem('auth_token', data.token);
    }
    return data;
};

export const authLogout = async () => {
    localStorage.removeItem('auth_token');
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
        headers: { 'Content-Type': 'application/json' },
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

// ── Marketplace: Creators ────────────────────────────────────

export const createCreatorProfile = async (walletAddress, displayName, bio = '', socials = {}) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/creators/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            wallet_address: walletAddress,
            display_name: displayName,
            bio,
            social_twitter: socials.twitter || '',
            social_github: socials.github || '',
            social_website: socials.website || '',
        })
    });
    return handleResponse(res);
};

export const getCreatorProfile = async (wallet) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/creators/${wallet}`);
    return handleResponse(res);
};

export const getCreatorAgents = async (wallet) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/creators/${wallet}/agents`);
    return handleResponse(res);
};

export const getCreatorEarnings = async (wallet) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/creators/${wallet}/earnings`);
    return handleResponse(res);
};

export const getCreatorAnalytics = async (wallet) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/creators/${wallet}/analytics`);
    return handleResponse(res);
};

export const confirmWithdrawal = async (walletAddress, txId) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/creators/withdraw/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress, tx_id: txId })
    });
    return handleResponse(res);
};

export const saveCreatorApiKey = async (walletAddress, provider, apiKey) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/creators/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress, provider, api_key: apiKey })
    });
    return handleResponse(res);
};

export const getApiKeyStatus = async (wallet) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/creators/api-keys/status/${wallet}`);
    return handleResponse(res);
};

export const deleteApiKey = async (wallet, provider) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/creators/api-keys/${wallet}/${provider}`, {
        method: 'DELETE'
    });
    return handleResponse(res);
};

// ── Marketplace: Agents ──────────────────────────────────────

export const createAgent = async (agentData) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
    });
    return handleResponse(res);
};

export const getAgentDetails = async (agentId) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/agents/${agentId}`);
    return handleResponse(res);
};

export const updateAgent = async (agentId, updateData) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
    });
    return handleResponse(res);
};

export const deactivateAgent = async (agentId, walletAddress) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/agents/${agentId}?wallet_address=${walletAddress}`, {
        method: 'DELETE'
    });
    return handleResponse(res);
};

export const browseMarketplace = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.limit) query.set('limit', params.limit);
    if (params.offset) query.set('offset', params.offset);
    const res = await apiFetch(`${BASE_URL}/api/v1/agents/marketplace/browse?${query}`);
    return handleResponse(res);
};

export const getTrendingAgents = async () => {
    const res = await apiFetch(`${BASE_URL}/api/v1/agents/marketplace/trending`);
    return handleResponse(res);
};

export const getCategories = async () => {
    const res = await apiFetch(`${BASE_URL}/api/v1/agents/marketplace/categories`);
    return handleResponse(res);
};

export const chatWithAgent = async (agentId, walletAddress, prompt, conversationId = null) => {
    const body = { wallet_address: walletAddress, prompt };
    if (conversationId) body.conversation_id = conversationId;
    const res = await apiFetch(`${BASE_URL}/api/v1/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        let errMessage = 'Unknown error';
        try { const data = await res.json(); errMessage = data.detail || JSON.stringify(data); } catch (_) {}
        throw new Error(errMessage);
    }
    return res;
};

export const getAgentReviews = async (agentId) => {
    const res = await apiFetch(`${BASE_URL}/api/v1/agents/${agentId}/reviews`);
    return handleResponse(res);
};

export const submitAgentReview = async (agentId, walletAddress, rating, reviewText = '') => {
    const res = await apiFetch(`${BASE_URL}/api/v1/agents/${agentId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress, rating, review_text: reviewText })
    });
    return handleResponse(res);
};

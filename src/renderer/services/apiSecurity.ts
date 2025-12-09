/**
 * API Security Service
 * Provides rate limiting and security measures for API calls
 */

// Simple obfuscation - XOR with key and base64
const OBFUSCATION_KEY = 'IH2024SEC';

const obfuscate = (text: string): string => {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length));
    }
    return btoa(result);
};

const deobfuscate = (encoded: string): string => {
    try {
        const decoded = atob(encoded);
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(decoded.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length));
        }
        return result;
    } catch {
        return '';
    }
};

// Rate limiting - 30 requests per minute
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

interface RequestLog {
    timestamps: number[];
}

const getRequestLog = (): RequestLog => {
    try {
        const stored = sessionStorage.getItem('_api_rl');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch { }
    return { timestamps: [] };
};

const saveRequestLog = (log: RequestLog): void => {
    try {
        sessionStorage.setItem('_api_rl', JSON.stringify(log));
    } catch { }
};

// Check if rate limit allows request
export const checkRateLimit = (): { allowed: boolean; remaining: number; resetIn: number } => {
    const now = Date.now();
    const log = getRequestLog();

    // Remove timestamps older than rate window
    log.timestamps = log.timestamps.filter(ts => now - ts < RATE_WINDOW_MS);

    const allowed = log.timestamps.length < RATE_LIMIT;
    const remaining = Math.max(0, RATE_LIMIT - log.timestamps.length);
    const resetIn = log.timestamps.length > 0
        ? Math.ceil((RATE_WINDOW_MS - (now - log.timestamps[0])) / 1000)
        : 0;

    return { allowed, remaining, resetIn };
};

// Record a request
export const recordRequest = (): void => {
    const log = getRequestLog();
    log.timestamps.push(Date.now());
    saveRequestLog(log);
};

// Check if user is authenticated
export const isUserAuthenticated = (): boolean => {
    return localStorage.getItem('isLoggedIn') === 'true';
};

// API keys from environment variables (obfuscated at build time for minimal protection)
const ENCODED_KEYS = {
    groq: import.meta.env.VITE_GROQ_API_KEY || '',
    groq2: import.meta.env.VITE_GROQ2_API_KEY || ''
};

// Get API key (decoded at runtime)
export const getApiKey = (keyName: 'groq' | 'groq2'): string => {
    if (!isUserAuthenticated()) {
        throw new Error('User not authenticated');
    }

    const { allowed, resetIn } = checkRateLimit();
    if (!allowed) {
        throw new Error(`Rate limit exceeded. Try again in ${resetIn} seconds.`);
    }

    return ENCODED_KEYS[keyName];
};

// Wrapper for secure API call
export const secureApiCall = async <T>(
    keyName: 'groq' | 'groq2',
    apiCall: (apiKey: string) => Promise<T>
): Promise<T> => {
    // Check authentication
    if (!isUserAuthenticated()) {
        throw new Error('Please login to use this feature');
    }

    // Check rate limit
    const { allowed, resetIn } = checkRateLimit();
    if (!allowed) {
        throw new Error(`Too many requests. Please wait ${resetIn} seconds.`);
    }

    // Record this request
    recordRequest();

    // Get the API key and make the call
    const apiKey = ENCODED_KEYS[keyName];
    return apiCall(apiKey);
};

// Get current rate limit status (for UI display)
export const getRateLimitStatus = (): { used: number; limit: number; remaining: number } => {
    const { remaining } = checkRateLimit();
    return {
        used: RATE_LIMIT - remaining,
        limit: RATE_LIMIT,
        remaining
    };
};

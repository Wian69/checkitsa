/**
 * Search limit tracker supporting 4 tiers
 */
export const trackSearch = () => {
    if (typeof window === 'undefined') return { canSearch: true, count: 0 }

    // Bypass all limits as requested
    return {
        canSearch: true,
        count: 0,
        limit: Infinity,
        tier: 'ultimate'
    }
}

export const checkLimit = () => {
    return true
}

export const setTier = (tier) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('checkitsa_tier', tier)
        // Reset count if it's a new subscription? Usually yes for monthly refresh but here for simplicity:
        // localStorage.setItem('checkitsa_searches', '0')
    }
}

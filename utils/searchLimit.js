/**
 * Search limit tracker supporting 4 tiers
 */
export const trackSearch = () => {
    if (typeof window === 'undefined') return { canSearch: true, count: 0 }

    // Get user from localStorage
    const userJson = localStorage.getItem('checkitsa_user')
    const user = userJson ? JSON.parse(userJson) : null

    // Admin Override: Grant ultimate access to your specific email
    const adminEmail = "wiandurandt69@gmail.com" // Update this with your actual email
    let tier = localStorage.getItem('checkitsa_tier') || (user ? user.tier : 'guest')

    if (user && user.email === adminEmail) {
        tier = 'ultimate'
    }

    const count = parseInt(localStorage.getItem('checkitsa_searches') || '0')

    let limit = 1 // Guest default
    if (tier === 'free') limit = 5 // Registered free (soft limit for now, user said 1 search for guest)
    if (tier === 'standard') limit = 20
    if (tier === 'pro') limit = 100
    if (tier === 'ultimate') limit = Infinity

    const newCount = count + 1

    if (newCount > limit) {
        return { canSearch: false, count, limit, tier }
    }

    localStorage.setItem('checkitsa_searches', newCount.toString())
    return {
        canSearch: true,
        count: newCount,
        limit,
        tier
    }
}

export const checkLimit = () => {
    if (typeof window === 'undefined') return true
    const userJson = localStorage.getItem('checkitsa_user')
    const user = userJson ? JSON.parse(userJson) : null
    const tier = localStorage.getItem('checkitsa_tier') || (user ? user.tier : 'guest')
    const count = parseInt(localStorage.getItem('checkitsa_searches') || '0')

    let limit = 1
    if (tier === 'free') limit = 5
    if (tier === 'standard') limit = 20
    if (tier === 'pro') limit = 100
    if (tier === 'ultimate') limit = Infinity

    return count < limit
}

export const setTier = (tier) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('checkitsa_tier', tier)
        // Reset count if it's a new subscription? Usually yes for monthly refresh but here for simplicity:
        // localStorage.setItem('checkitsa_searches', '0')
    }
}

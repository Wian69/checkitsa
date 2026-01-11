const TIERS = {
    free: { limit: 5, reset: 'lifetime', label: 'Free Trial' },
    pro: { limit: 100, reset: 'monthly', label: 'Pro' },
    elite: { limit: 1000, reset: 'monthly', label: 'Elite' },
    custom: { limit: 5000, reset: 'monthly', label: 'Enterprise' } // Example custom
}

export const trackSearch = () => {
    if (typeof window === 'undefined') return { canSearch: true, count: 0 }

    // 1. Get User State (Mocking DB persistence with LocalStorage for MVP)
    const tier = localStorage.getItem('checkitsa_tier') || 'free'
    let count = parseInt(localStorage.getItem('checkitsa_usage') || '0')
    let lastReset = localStorage.getItem('checkitsa_last_reset') || new Date().toISOString()
    const customLimit = parseInt(localStorage.getItem('checkitsa_custom_limit') || '0')

    // 2. Determine Limit
    let limit = TIERS[tier] ? TIERS[tier].limit : 5
    if (tier === 'custom' && customLimit > 0) limit = customLimit

    // 3. Check for Reset (For Paid Tiers)
    const now = new Date()
    const last = new Date(lastReset)

    // Reset if it's a new month AND user is on a monthly plan
    const isNewMonth = now.getMonth() !== last.getMonth() || now.getFullYear() !== last.getFullYear()

    if (TIERS[tier] && TIERS[tier].reset === 'monthly' && isNewMonth) {
        count = 0
        localStorage.setItem('checkitsa_usage', '0')
        localStorage.setItem('checkitsa_last_reset', now.toISOString())
        // console.log('Monthly usage reset!')
    }

    // 4. Return Status
    const remaining = limit - count
    return {
        canSearch: count < limit,
        tier: tier,
        count: count,
        limit: limit,
        remaining: remaining,
        resetType: TIERS[tier] ? TIERS[tier].reset : 'lifetime'
    }
}

export const incrementSearch = () => {
    if (typeof window === 'undefined') return
    let count = parseInt(localStorage.getItem('checkitsa_usage') || '0')
    localStorage.setItem('checkitsa_usage', (count + 1).toString())
}

export const setTier = (tier, customLimit = 0) => {
    if (typeof window === 'undefined') return
    localStorage.setItem('checkitsa_tier', tier)
    if (customLimit > 0) localStorage.setItem('checkitsa_custom_limit', customLimit.toString())

    // Optional: Reset usage on upgrade? 
    // Usually better to keep usage but reset "last_reset" to start the cycle.
    localStorage.setItem('checkitsa_last_reset', new Date().toISOString())
}

// Helper to get user-specific key
const getUserKey = (base) => {
    if (typeof window === 'undefined') return base
    try {
        const user = JSON.parse(localStorage.getItem('checkitsa_user'))
        if (user && user.email) return `${base}_${user.email}`
    } catch (e) { }
    return base
}

export const addToHistory = (type, query, status) => {
    if (typeof window === 'undefined') return
    const key = getUserKey('checkitsa_history')
    const history = JSON.parse(localStorage.getItem(key) || '[]')
    const newEntry = {
        id: Date.now(),
        type,
        query,
        status,
        date: new Date().toISOString()
    }
    // Keep last 50
    const updated = [newEntry, ...history].slice(0, 50)
    localStorage.setItem(key, JSON.stringify(updated))
}

export const addToReportHistory = (report) => {
    if (typeof window === 'undefined') return
    const key = getUserKey('checkitsa_my_reports')
    const history = JSON.parse(localStorage.getItem(key) || '[]')
    const newEntry = {
        id: Date.now(),
        ...report,
        status: 'Pending Review',
        date: new Date().toISOString()
    }
    // Keep last 20
    const updated = [newEntry, ...history].slice(0, 20)
    localStorage.setItem(key, JSON.stringify(updated))
}

export const getHistory = () => {
    if (typeof window === 'undefined') return { searches: [], reports: [] }
    const searchKey = getUserKey('checkitsa_history')
    const reportKey = getUserKey('checkitsa_my_reports')
    return {
        searches: JSON.parse(localStorage.getItem(searchKey) || '[]'),
        reports: JSON.parse(localStorage.getItem(reportKey) || '[]')
    }
}

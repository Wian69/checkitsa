const TIERS = {
    free: { limit: 5, reset: 'lifetime', label: 'Free Trial' },
    pro: { limit: 100, reset: 'monthly', label: 'Pro' },
    elite: { limit: 1000, reset: 'monthly', label: 'Elite' },
    custom: { limit: 5000, reset: 'monthly', label: 'Enterprise' }
}

export const trackSearch = () => {
    if (typeof window === 'undefined') return { canSearch: true, count: 0 }

    const userStr = localStorage.getItem('checkitsa_user')
    const user = userStr ? JSON.parse(userStr) : null

    // Load from local as fallback/initial
    const tier = localStorage.getItem('checkitsa_tier') || (user ? user.tier : 'free')
    const usageKey = user ? `checkitsa_usage_${user.email}` : 'checkitsa_usage'
    const count = parseInt(localStorage.getItem(usageKey) || '0')
    const customLimit = parseInt(localStorage.getItem('checkitsa_custom_limit') || '0')

    let limit = TIERS[tier] ? TIERS[tier].limit : 5
    if (customLimit > 0) limit = customLimit

    return {
        canSearch: count < limit,
        tier: tier,
        count: count,
        limit: limit,
        remaining: limit - count,
        resetType: TIERS[tier] ? TIERS[tier].reset : 'lifetime'
    }
}

export const incrementSearch = async () => {
    if (typeof window === 'undefined') return

    const userStr = localStorage.getItem('checkitsa_user')
    const user = userStr ? JSON.parse(userStr) : null
    const key = user ? `checkitsa_usage_${user.email}` : 'checkitsa_usage'

    let count = parseInt(localStorage.getItem(key) || '0')
    localStorage.setItem(key, (count + 1).toString())

    // SYNC TO CLOUD
    if (user && user.email) {
        fetch('/api/user/sync', {
            method: 'POST',
            body: JSON.stringify({ email: user.email, action: 'increment' })
        }).catch(e => console.error('Sync Error:', e))
    }
}

export const addToHistory = async (type, query, status) => {
    if (typeof window === 'undefined') return

    const userStr = localStorage.getItem('checkitsa_user')
    const user = userStr ? JSON.parse(userStr) : null
    const key = user ? `checkitsa_history_${user.email}` : 'checkitsa_history'

    const history = JSON.parse(localStorage.getItem(key) || '[]')
    const newEntry = {
        id: Date.now(),
        type,
        query,
        status,
        date: new Date().toISOString()
    }
    const updated = [newEntry, ...history].slice(0, 50)
    localStorage.setItem(key, JSON.stringify(updated))

    // SYNC TO CLOUD
    if (user && user.email) {
        fetch('/api/user/sync', {
            method: 'POST',
            body: JSON.stringify({
                email: user.email,
                action: 'history',
                data: { type, query, status }
            })
        }).catch(e => console.error('Sync Error:', e))
    }
}

export const getHistory = () => {
    if (typeof window === 'undefined') return { searches: [], reports: [] }
    const userStr = localStorage.getItem('checkitsa_user')
    const user = userStr ? JSON.parse(userStr) : null

    const searchKey = user ? `checkitsa_history_${user.email}` : 'checkitsa_history'
    const reportKey = user ? `checkitsa_my_reports_${user.email}` : 'checkitsa_my_reports'

    return {
        searches: JSON.parse(localStorage.getItem(searchKey) || '[]'),
        reports: JSON.parse(localStorage.getItem(reportKey) || '[]')
    }
}

// Function to refresh local data from Cloud (called on login/dashboard load)
export const syncFromCloud = async (email) => {
    if (!email) return
    try {
        const res = await fetch(`/api/user/sync?email=${encodeURIComponent(email)}`)
        const data = await res.json()
        if (data.meta) {
            localStorage.setItem(`checkitsa_usage_${email}`, data.meta.count.toString())
            localStorage.setItem('checkitsa_tier', data.meta.tier)
            if (data.meta.limit) localStorage.setItem('checkitsa_custom_limit', data.meta.limit.toString())
        }
        if (data.history) {
            // Map DB fields to Local IDs
            const mappedHistory = data.history.map(h => ({
                id: h.id,
                type: h.search_type,
                query: h.query,
                status: h.result_status,
                date: h.created_at
            }))
            localStorage.setItem(`checkitsa_history_${email}`, JSON.stringify(mappedHistory))
        }
        return data
    } catch (e) {
        console.error('Cloud Sync Failed:', e)
    }
}

export const setTier = async (tier, customLimit = 0) => {
    if (typeof window === 'undefined') return

    const userStr = localStorage.getItem('checkitsa_user')
    const user = userStr ? JSON.parse(userStr) : null

    localStorage.setItem('checkitsa_tier', tier)
    if (customLimit > 0) localStorage.setItem('checkitsa_custom_limit', customLimit.toString())
    localStorage.setItem('checkitsa_last_reset', new Date().toISOString())

    // SYNC TO CLOUD
    if (user && user.email) {
        fetch('/api/user/sync', {
            method: 'POST',
            body: JSON.stringify({
                email: user.email,
                action: 'tier',
                data: { tier, customLimit }
            })
        }).catch(e => console.error('Sync Error:', e))
    }
}

export const addToReportHistory = (report) => {
    if (typeof window === 'undefined') return
    const userStr = localStorage.getItem('checkitsa_user')
    const user = userStr ? JSON.parse(userStr) : null
    const key = user ? `checkitsa_my_reports_${user.email}` : 'checkitsa_my_reports'

    const history = JSON.parse(localStorage.getItem(key) || '[]')
    const newEntry = {
        id: Date.now(),
        ...report,
        status: 'Pending Review',
        date: new Date().toISOString()
    }
    const updated = [newEntry, ...history].slice(0, 20)
    localStorage.setItem(key, JSON.stringify(updated))
}


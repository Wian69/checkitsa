chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
        const storage = await chrome.storage.local.get(['userEmail', 'userAuth', 'userTier']);
        
        // Only run Auto-Scan for Premium users (Free users must scan manually)
        if (!storage.userEmail || !storage.userAuth || storage.userTier === 'free') {
            return;
        }

        try {
            const urlObj = new URL(tab.url);
            const cleanDomain = urlObj.hostname.replace(/^www\./, '');
            
            // Check if we recently scanned this EXACT domain (within 2 hours) to save quota!
            const cacheKey = `domainCache_${cleanDomain}`;
            const domainCache = await chrome.storage.local.get(cacheKey);
            
            if (domainCache[cacheKey] && (Date.now() - domainCache[cacheKey].timestamp < 2 * 60 * 60 * 1000)) {
                // Reuse the cached result instead of hitting the API
                const data = domainCache[cacheKey].data;
                chrome.storage.local.set({ [`autoScanResult_${tabId}`]: data });
                applyBadge(tabId, data);
                return;
            }

            // Call API
            const response = await fetch('https://checkitsa.co.za/api/extension-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    url: cleanDomain,
                    email: storage.userEmail,
                    password: storage.userAuth,
                    isAutoScan: true
                })
            });

            if (!response.ok) return;

            const resData = await response.json();
            if (resData.success && resData.data) {
                const data = resData.data;
                
                // Cache the result for this TAB (so popup can show it)
                // AND cache it for the DOMAIN (so reloads don't waste quota)
                chrome.storage.local.set({ 
                    [`autoScanResult_${tabId}`]: data,
                    [cacheKey]: { timestamp: Date.now(), data: data },
                    scansUsed: resData.scansUsed 
                });
                
                applyBadge(tabId, data);
            }
        } catch (e) {
            console.error("Auto-scan error", e);
        }
    }
});

// Helper function to apply the visual badge
function applyBadge(tabId, data) {
    if (data.verdict === 'Dangerous' || data.riskScore > 60) {
        chrome.action.setBadgeText({ text: "X", tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: "#ef4444", tabId: tabId }); // Red
        
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: injectRedBanner,
            args: [data.message]
        }).catch(() => {});
    } else if (data.verdict === 'Suspicious' || data.riskScore > 40) {
        chrome.action.setBadgeText({ text: "!", tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: "#f59e0b", tabId: tabId }); // Yellow
    } else {
        chrome.action.setBadgeText({ text: "✓", tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: "#10b981", tabId: tabId }); // Green
    }
}

chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.local.remove(`autoScanResult_${tabId}`);
});

// Function to inject warning banner into the actual website
function injectRedBanner(customMessage) {
    if (document.getElementById('checkitsa-warning-banner')) return;
    
    const banner = document.createElement('div');
    banner.id = 'checkitsa-warning-banner';
    banner.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
            <span style="font-size: 24px;">🚨</span>
            <div>
                <strong>CheckItSA SECURITY ALERT</strong>
                <div style="font-size: 14px; margin-top: 4px; font-weight: normal;">${customMessage || 'This website has been flagged as a known scam by the Premium Auto-Scan Engine. Do not enter any financial information.'}</div>
            </div>
            <button id="checkitsa-close-banner" style="background: rgba(0,0,0,0.3); border: none; color: white; padding: 5px 10px; border-radius: 4px; margin-left: 20px; cursor: pointer;">Close</button>
        </div>
    `;
    Object.assign(banner.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        backgroundColor: '#ef4444',
        color: 'white',
        zIndex: '2147483647',
        padding: '15px',
        textAlign: 'center',
        fontFamily: 'sans-serif',
        fontSize: '16px',
        fontWeight: 'bold',
        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
        borderBottom: '3px solid #b91c1c'
    });

    document.body.prepend(banner);
    
    document.getElementById('checkitsa-close-banner').addEventListener('click', () => {
        banner.remove();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const currentUrlEl = document.getElementById('currentUrl');
    const scanBtn = document.getElementById('scanBtn');
    const loader = document.getElementById('loader');
    const resultBox = document.getElementById('resultBox');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultDesc = document.getElementById('resultDesc');
    const scansLeftEl = document.getElementById('scansLeft');
    const mainScreen = document.getElementById('mainScreen');
    const lockScreen = document.getElementById('lockScreen');
    const loginScreen = document.getElementById('loginScreen');
    const authBtn = document.getElementById('authBtn');
    const showLoginFromLock = document.getElementById('showLoginFromLock');

    // Login Elements
    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    const loggedInState = document.getElementById('loggedInState');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const userTierDisplay = document.getElementById('userTierDisplay');
    const logoutBtn = document.getElementById('logoutBtn');

    let MAX_SCANS = 5;
    let isPremium = false;

    // View Routing
    const showView = (viewId) => {
        mainScreen.style.display = 'none';
        lockScreen.style.display = 'none';
        loginScreen.style.display = 'none';
        document.getElementById(viewId).style.display = 'block';
    }

    authBtn.addEventListener('click', () => {
        if (loginScreen.style.display === 'block') {
            showView(isPremium || scansUsed < MAX_SCANS ? 'mainScreen' : 'lockScreen');
        } else {
            showView('loginScreen');
        }
    });

    showLoginFromLock.addEventListener('click', () => showView('loginScreen'));

    let scansUsed = 0;

    // Initialize State
    chrome.storage.local.get(['scansUsed', 'userEmail', 'userTier', 'userAuth'], async (result) => {
        scansUsed = result.scansUsed || 0;
        
        // Setup Auth State
        if (result.userEmail && result.userAuth) {
            setupLoggedInUI(result.userEmail, result.userTier);
        } else {
            MAX_SCANS = 5;
        }

        if (scansUsed >= MAX_SCANS) {
            showView('lockScreen');
            return;
        }

        updateScanCounter();

        // Get current tab URL
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const currentTab = tabs[0];
            const url = new URL(currentTab.url);
            
            // Don't allow scanning of chrome:// or local files
            if (!url.protocol.startsWith('http')) {
                currentUrlEl.textContent = "System Page - Cannot Scan";
                scanBtn.disabled = true;
                scanBtn.style.opacity = '0.5';
                return;
            }

            const cleanDomain = url.hostname.replace(/^www\./, '');
            currentUrlEl.textContent = cleanDomain;

            // Handle Scan Button Click
            scanBtn.addEventListener('click', async () => {
                // UI Loading State
                scanBtn.style.display = 'none';
                loader.style.display = 'block';
                resultBox.style.display = 'none';

                try {
                    // Get stored password if logged in
                    const storage = await chrome.storage.local.get(['userEmail', 'userAuth', 'userTier']);
                    
                    // Call the new Authenticated CheckItSA API
                    const response = await fetch('https://checkitsa.co.za/api/extension-scan', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            url: cleanDomain,
                            email: storage.userEmail || null,
                            password: storage.userAuth || null,
                            isAutoScan: false
                        })
                    });
                    
                    if (response.status === 403) {
                        showView('lockScreen');
                        return;
                    }

                    if (response.status === 401) {
                        alert("Authentication failed. Please sign in again.");
                        showView('loginScreen');
                        return;
                    }

                    const resData = await response.json();
                    if (!resData.success) {
                        throw new Error(resData.message || "Failed to scan");
                    }

                    // Update quota from server
                    scansUsed = resData.scansUsed;
                    chrome.storage.local.set({ scansUsed });
                    updateScanCounter();

                    const data = resData.data; // The actual scanner payload
                    
                    // Delay for dramatic effect
                    await new Promise(r => setTimeout(r, 1000));

                    loader.style.display = 'none';
                    resultBox.style.display = 'block';

                    // Process Results
                    resultBox.className = 'result-box'; // reset classes

                    if (data.safe) {
                        resultBox.classList.add('safe');
                        resultIcon.textContent = '✅';
                        resultTitle.textContent = 'Website is Safe';
                        resultTitle.style.color = '#10b981';
                        resultDesc.textContent = `Risk Score: ${data.riskScore}/100. ${data.message || 'Verified by CheckItSA.'}`;
                    } else if (data.verdict === 'Dangerous' || data.riskScore > 60) {
                        resultBox.classList.add('danger');
                        resultIcon.textContent = '🚨';
                        resultTitle.textContent = 'DANGER: Known Scam!';
                        resultTitle.style.color = '#ef4444';
                        resultDesc.textContent = `WARNING: Risk Score ${data.riskScore}/100. ${data.message || 'Do not enter personal info!'}`;

                        // Inject Red Banner into the page
                        chrome.scripting.executeScript({
                            target: { tabId: currentTab.id },
                            func: injectRedBanner
                        });
                    } else {
                        resultBox.classList.add('neutral');
                        resultIcon.textContent = '⚠️';
                        resultTitle.textContent = 'Suspicious Website';
                        resultTitle.style.color = '#f59e0b';
                        resultDesc.textContent = `Risk Score: ${data.riskScore}/100. ${data.message || 'Proceed with caution.'}`;
                    }

                    // Check if they just hit the limit
                    if (scansUsed >= MAX_SCANS) {
                        setTimeout(() => {
                            showView('lockScreen');
                        }, 5000); // Let them read the result for 5 seconds before locking
                    }

                } catch (error) {
                    loader.style.display = 'none';
                    scanBtn.style.display = 'flex';
                    alert("Error connecting to CheckItSA servers.");
                }
            });

        } catch (error) {
            currentUrlEl.textContent = "Error detecting URL";
        }
    });

    // --- Authentication Logic ---
    function setupLoggedInUI(email, tier) {
        userEmailDisplay.textContent = email;
        userTierDisplay.textContent = `${tier} TIER ACTIVE`;
        loginForm.style.display = 'none';
        loggedInState.style.display = 'block';
        
        isPremium = (tier === 'pro' || tier === 'elite' || tier === 'custom');
        
        if (tier === 'elite' || tier === 'custom') {
            MAX_SCANS = 1000;
        } else if (tier === 'pro') {
            MAX_SCANS = 100;
        } else {
            MAX_SCANS = 5;
        }
    }

    function updateScanCounter() {
        if (scansLeftEl) {
            scansLeftEl.textContent = MAX_SCANS - scansUsed;
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginEmail.value.trim();
        const password = loginPassword.value;
        
        loginBtn.textContent = 'Verifying...';
        loginBtn.disabled = true;
        loginError.style.display = 'none';

        try {
            const res = await fetch('https://checkitsa.co.za/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            
            if (data.success && data.user) {
                const tier = data.user.tier || 'free';
                
                chrome.storage.local.set({ 
                    userEmail: data.user.email,
                    userTier: tier,
                    userAuth: password
                });
                
                setupLoggedInUI(data.user.email, tier);
                
                // If they are premium and were locked out, restore them immediately
                if (tier === 'pro' || tier === 'elite' || tier === 'custom') {
                    showView('mainScreen');
                } else {
                    // Still Free tier
                    alert("Account linked! Note: You are on the Free tier. Upgrade at checkitsa.co.za/pricing for unlimited scans.");
                    showView(scansUsed >= MAX_SCANS ? 'lockScreen' : 'mainScreen');
                }
            } else {
                loginError.textContent = data.message || 'Invalid credentials.';
                loginError.style.display = 'block';
            }
        } catch (err) {
            loginError.textContent = 'Connection error. Check your internet.';
            loginError.style.display = 'block';
        } finally {
            loginBtn.textContent = 'Sign In';
            loginBtn.disabled = false;
        }
    });

    logoutBtn.addEventListener('click', () => {
        chrome.storage.local.remove(['userEmail', 'userTier', 'userAuth']);
        isPremium = false;
        loginForm.style.display = 'block';
        loggedInState.style.display = 'none';
        loginEmail.value = '';
        loginPassword.value = '';
        
        // Restore free tier UI
        scansLeftEl.parentNode.innerHTML = '<span id="scansLeft"></span> free scans remaining';
        updateScanCounter();
        
        if (scansUsed >= MAX_SCANS) {
            showView('lockScreen');
        } else {
            showView('mainScreen');
        }
    });
});

// Function to inject warning banner into the actual website
function injectRedBanner() {
    if (document.getElementById('checkitsa-warning-banner')) return;
    
    const banner = document.createElement('div');
    banner.id = 'checkitsa-warning-banner';
    banner.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
            <span style="font-size: 24px;">🚨</span>
            <div>
                <strong>CheckItSA SECURITY ALERT</strong>
                <div style="font-size: 14px; margin-top: 4px; font-weight: normal;">This website has been flagged as a known scam. Do not enter any financial information.</div>
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

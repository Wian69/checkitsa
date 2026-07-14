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

    const MAX_SCANS = 5;

    // Initialize State
    chrome.storage.local.get(['scansUsed'], async (result) => {
        let scansUsed = result.scansUsed || 0;
        
        if (scansUsed >= MAX_SCANS) {
            mainScreen.style.display = 'none';
            lockScreen.style.display = 'block';
            return;
        }

        scansLeftEl.textContent = MAX_SCANS - scansUsed;

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
                // Deduct credit
                scansUsed++;
                chrome.storage.local.set({ scansUsed });
                scansLeftEl.textContent = MAX_SCANS - scansUsed;

                // UI Loading State
                scanBtn.style.display = 'none';
                loader.style.display = 'block';
                resultBox.style.display = 'none';

                try {
                    // Call the CheckItSA API
                    const response = await fetch('https://checkitsa.co.za/api/scan', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: cleanDomain })
                    });
                    
                    const data = await response.json();
                    
                    // Delay for dramatic effect
                    await new Promise(r => setTimeout(r, 1000));

                    loader.style.display = 'none';
                    resultBox.style.display = 'block';

                    // Process Results
                    resultBox.className = 'result-box'; // reset classes

                    if (data.isSafe) {
                        resultBox.classList.add('safe');
                        resultIcon.textContent = '✅';
                        resultTitle.textContent = 'Website is Safe';
                        resultTitle.style.color = '#10b981';
                        resultDesc.textContent = `No scams reported for ${cleanDomain}. Verified by CheckItSA.`;
                    } else if (data.isDangerous) {
                        resultBox.classList.add('danger');
                        resultIcon.textContent = '🚨';
                        resultTitle.textContent = 'DANGER: Known Scam!';
                        resultTitle.style.color = '#ef4444';
                        resultDesc.textContent = `WARNING: ${cleanDomain} has been flagged in our national fraud database. Do not enter personal info!`;

                        // Inject Red Banner into the page
                        chrome.scripting.executeScript({
                            target: { tabId: currentTab.id },
                            func: injectRedBanner
                        });
                    } else {
                        resultBox.classList.add('neutral');
                        resultIcon.textContent = '⚠️';
                        resultTitle.textContent = 'Unverified Website';
                        resultTitle.style.color = '#f59e0b';
                        resultDesc.textContent = `We don't have enough data on ${cleanDomain}. Proceed with caution.`;
                    }

                    // Check if they just hit the limit
                    if (scansUsed >= MAX_SCANS) {
                        setTimeout(() => {
                            mainScreen.style.display = 'none';
                            lockScreen.style.display = 'block';
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

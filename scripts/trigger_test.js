

async function triggerTest() {
    console.log("Triggering Test Email...");
    try {
        const res = await fetch('https://checkitsa.co.za/api/admin/blast-newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                isTest: true,
                testEmail: 'wiandurandt69@gmail.com'
            })
        });

        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
        
        if (res.ok) {
            console.log("✅ Test email successfully triggered! Check your inbox.");
        } else {
            console.error("❌ Failed to trigger test email.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

triggerTest();

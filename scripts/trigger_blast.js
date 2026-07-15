

async function triggerBlast() {
    console.log("Triggering PRODUCTION Email Blast to ALL users...");
    try {
        const res = await fetch('https://checkitsa.co.za/api/admin/blast-newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                isTest: false
            })
        });

        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
        
        if (res.ok) {
            console.log("✅ Blast successfully triggered!");
        } else {
            console.error("❌ Failed to trigger blast.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

triggerBlast();

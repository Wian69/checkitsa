
async function sendTest() {
    console.log('Testing Resend API...');
    const resendApiKey = 're_AqdBt9WW_2xS7jw2uuExuzJARbTuN2juR'; // User provided key

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev', // Default test sender for free tier
                to: 'info@checkitsa.co.za', // User's verified email? Or maybe they haven't verified it yet?
                // For Resend free tier, you can only send to the email you signed up with unless you verify the domain.
                // If info@checkitsa.co.za isn't the signup email, this might fail properly, which is good to know.
                subject: `🚨 Test Email from CLI`,
                html: `<p>If you see this, the API key works!</p>`
            })
        });

        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (!res.ok) {
            console.error('FAILED. Potential reasons:');
            console.error('1. "to" address must be the account owner email (if domain not verified)');
            console.error('2. API Key is invalid');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

sendTest();

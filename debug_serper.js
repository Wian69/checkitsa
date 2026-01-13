const serperKey = '7c86722fde870590686576c987a15f96f76491c5';

async function testSerper() {
    try {
        // Updated query to be more aggressive about the 1996 entity
        const q = "Grain Carriers (Pty) Ltd 1996 registration number";
        console.log(`Searching for: ${q}`);

        const res = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
            body: JSON.stringify({ q, gl: "za" })
        });

        const data = await res.json();
        console.log("KNOWLEDGE GRAPH:", JSON.stringify(data.knowledgeGraph || "None", null, 2));
        console.log("ORGANIC RESULT 1:", JSON.stringify(data.organic?.[0] || "None", null, 2));
        console.log("ORGANIC RESULT 2:", JSON.stringify(data.organic?.[1] || "None", null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

testSerper();

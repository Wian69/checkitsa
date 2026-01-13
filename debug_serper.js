const serperKey = '7c86722fde870590686576c987a15f96f76491c5';

async function testSerperFull() {
    try {
        const q = "Shoprite South Africa"; // Major entity to trigger Knowledge Graph
        console.log(`Searching for: ${q}`);

        const res = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
            body: JSON.stringify({
                q,
                gl: "za",
                k: 20
            })
        });

        const data = await res.json();
        const keys = Object.keys(data);
        console.log("AVAILABLE SECTIONS:", keys);

        if (data.knowledgeGraph) {
            console.log("\n--- KNOWLEDGE GRAPH ---");
            console.log(JSON.stringify(data.knowledgeGraph, null, 2));
        }

        if (data.places && data.places.length > 0) {
            console.log("\n--- PLACES ---");
            console.log(JSON.stringify(data.places[0], null, 2));
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testSerperFull();

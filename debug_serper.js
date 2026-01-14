const serperKey = '7c86722fde870590686576c987a15f96f76491c5';

async function testSerperFull() {
    try {
        const input = "Grain Carriers";
        // COMMERCIAL GRADE STRATEGY TEST
        // Instead of hoping the company website lists directors, we check structured directories.
        const qTargeted = `site:b2bhint.com OR site:sa-companies.com OR site:easyinfo.co.za "${input}" directors vat`;

        console.log(`[Debug] Targeted Source Search: "${qTargeted}"`);

        const [resTargeted] = await Promise.all([
            fetch("https://google.serper.dev/search", {
                method: "POST",
                headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
                body: JSON.stringify({ q: qTargeted, gl: "za" })
            })
        ]);

        const dataTargeted = await resTargeted.json();

        console.log("\n--- TARGETED DIRECTORY RESULTS ---");
        // Log the snippets to see if they contain "Directors: ..." cleanly
        if (dataTargeted.organic) {
            dataTargeted.organic.forEach((r, i) => {
                console.log(`[${i}] ${r.title}\n    ${r.snippet}`);
            });
        }

        // Removed Entity/Details calls for this specific Directory test to avoid errors
        const context = {
            directoryResults: dataTargeted.organic || []
        };

        // 2. Merged Context Construction (Matching route.js)
        /* const context = {
            knowledgeGraph: dataEntity.knowledgeGraph,
            peopleAlsoAsk: dataEntity.peopleAlsoAsk,
            snippets: [
                ...(dataDetails.organic || []).slice(0, 6),
                ...(dataEntity.organic || []).slice(0, 3)
            ].map(r => ({ title: r.title, snippet: r.snippet, link: r.link })),
            places: dataEntity.places || dataDetails.places
        }; */

        console.log("\n--- MERGED CONTEXT ---");
        console.log(JSON.stringify(context, null, 2));

    } catch (error) {
        console.error(error);
    }
}

testSerperFull();

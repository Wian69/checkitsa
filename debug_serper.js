const serperKey = '7c86722fde870590686576c987a15f96f76491c5';

async function testSerperFull() {
    try {
        const input = "Grain Carriers";
        const qEntity = `${input} South Africa`;
        const qDetails = `${input} South Africa registration number address phone contact`;

        console.log(`[Debug] Parallel Search: Entity="${qEntity}" | Details="${qDetails}"`);

        const [resEntity, resDetails] = await Promise.all([
            fetch("https://google.serper.dev/search", {
                method: "POST",
                headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
                body: JSON.stringify({ q: qEntity, gl: "za" })
            }),
            fetch("https://google.serper.dev/search", {
                method: "POST",
                headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
                body: JSON.stringify({ q: qDetails, gl: "za" })
            })
        ]);

        const dataEntity = await resEntity.json();
        const dataDetails = await resDetails.json();

        // 2. Merged Context Construction (Matching route.js)
        const context = {
            knowledgeGraph: dataEntity.knowledgeGraph,
            peopleAlsoAsk: dataEntity.peopleAlsoAsk,
            snippets: [
                ...(dataDetails.organic || []).slice(0, 6),
                ...(dataEntity.organic || []).slice(0, 3)
            ].map(r => ({ title: r.title, snippet: r.snippet, link: r.link })),
            places: dataEntity.places || dataDetails.places
        };

        console.log("\n--- MERGED CONTEXT ---");
        console.log(JSON.stringify(context, null, 2));

    } catch (error) {
        console.error(error);
    }
}

testSerperFull();

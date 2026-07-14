fetch('https://html.duckduckgo.com/html/?q="wian@example.com" OR "Wian Du Randt"')
  .then(r => r.text())
  .then(html => {
    const domains = [];
    const regex = /<a class="result__url" href="[^"]+">\s*([^<]+)\s*<\/a>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      domains.push(match[1].trim());
    }
    console.log("Found Domains:", domains);
  })
  .catch(console.error);

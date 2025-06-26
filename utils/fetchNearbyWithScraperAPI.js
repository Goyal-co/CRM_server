import axios from 'axios';

async function fetchNearbyProjects(location = "Whitefield Main Road") {
  const searchQuery = `site:magicbricks.com "${location}" under construction projects`;
  const encodedQuery = encodeURIComponent(searchQuery);
  const googleUrl = `https://www.bing.com/search?q=${encodedQuery}`;

  const apiKey = "ee83493f93c9f468ecb346d390be29ff";
  const scraperUrl = `https://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(googleUrl)}`;

  try {
    const res = await axios.get(scraperUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113 Safari/537.36",
      },
    });

    const html = res.data;
    const results = [];

    // Simple title + link + snippet regex
    const regex = /<a href="\/url\?q=(.*?)&amp.*?>(.*?)<\/a>.*?<span class="VwiC3b.*?">(.*?)<\/span>/gms;

    let match;
    while ((match = regex.exec(html)) !== null) {
      const url = decodeURIComponent(match[1]);
      const title = match[2].replace(/<[^>]*>?/gm, "").trim();
      const snippet = match[3].replace(/<[^>]*>?/gm, "").trim();

      if (url.includes("magicbricks.com")) {
        results.push({ title, url, snippet });
      }
    }

    return results.slice(0, 5);
  } catch (err) {
    console.error("❌ ScraperAPI fetch failed:", err.message);
    return [];
  }
}

export default fetchNearbyProjects;

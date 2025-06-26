const fetchNearbyProjects = require("./utils/fetchNearbyWithScraperAPI");

fetchNearbyProjects("Whitefield Main Road").then((results) => {
  console.log("📊 ScraperAPI Nearby Projects:", results);
});

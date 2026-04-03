const feeds = [
  { url: 'feed1.xml', label: '82MHz' },
  { url: 'feed2.xml', label: 'Just Some Code' },
  { url: 'feed3.xml', label: 'Rubenerd' },
  { url: 'feed4.xml', label: 'BBC Technology' }
];
const ITEMS_PER_FEED = 4;

async function fetchFeed(url) {
  const res = await fetch(url);
  const text = await res.text();
  const parser = new DOMParser();
  return parser.parseFromString(text, "text/xml");
}

function parseRSS(doc) {
  const items = [...doc.querySelectorAll("item")].slice(0, ITEMS_PER_FEED);
  return items.map(item => ({
    title: item.querySelector("title")?.textContent ?? "(No title)",
    link: item.querySelector("link")?.textContent ?? "#",
    date: new Date(item.querySelector("pubDate")?.textContent ?? 0)
  }));
}

function parseAtom(doc) {
  const entries = [...doc.querySelectorAll("entry")].slice(0, ITEMS_PER_FEED);
  return entries.map(entry => ({
    title: entry.querySelector("title")?.textContent ?? "(No title)",
    link: entry.querySelector("link")?.getAttribute("href") ?? "#",
    date: new Date(entry.querySelector("updated")?.textContent ?? 0)
  }));
}

function parseFeed(doc) {
  if (doc.querySelector("item")) return parseRSS(doc);
  if (doc.querySelector("entry")) return parseAtom(doc);
  return [];
}

(async () => {
  const allItems = [];

  for (const { url, label } of feeds) {
    try {
      const doc = await fetchFeed(url);
      const items = parseFeed(doc).map(item => ({ ...item, source: label }));
      allItems.push(...items);
    } catch (err) {
      console.error(`Error parsing ${url}:`, err);
    }
  }

  allItems.sort((a, b) => b.date - a.date);

  const ul = document.createElement("ul");
  for (const item of allItems) {
    const li = document.createElement("li");

    const a = document.createElement("a");
    a.href = item.link;
    a.textContent = item.title;
    a.target = "_blank";
    a.rel = "noopener noreferrer";

    const sourceSpan = document.createElement("span");
    sourceSpan.className = "source-label";
    sourceSpan.textContent = ` • ${item.source}`;

    const dateSpan = document.createElement("span");
    dateSpan.className = "date-label";
    dateSpan.textContent = ` (${item.date.toISOString().split("T")[0]})`;

    li.appendChild(a);
    li.appendChild(sourceSpan);
    li.appendChild(dateSpan);
    ul.appendChild(li);
  }

  document.getElementById("feed-box").innerHTML = "";
  document.getElementById("feed-box").appendChild(ul);
})();

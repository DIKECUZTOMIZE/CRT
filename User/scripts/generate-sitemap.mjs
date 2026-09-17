import fs from 'node:fs';
import path from 'node:path';

const siteUrl = 'https://www.crtcompete.com';
const apiBaseUrl = process.env.VITE_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://api.crtcompete.com');
const publicUrls = [
  '/',
  '/about',
  '/filter',
];

const privatePaths = new Set([
  '/login',
  '/register',
  '/profile',
  '/user-profile',
  '/admin',
  '/organizer',
]);

const buildEventUrl = (eventId) => `${siteUrl}/events/${eventId}`;

const generateStaticUrls = () => publicUrls.map((url) => ({
  loc: `${siteUrl}${url}`,
  changefreq: url === '/' ? 'daily' : 'weekly',
  priority: url === '/' ? '1.0' : '0.8',
}));

const generateEventUrls = async () => {
  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/events/public?page=1&limit=200`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    const events = Array.isArray(payload?.data?.events)
      ? payload.data.events
      : Array.isArray(payload?.events)
        ? payload.events
        : [];

    return events
      .map((event) => event?._id || event?.id)
      .filter((id) => typeof id === 'string' && id.trim().length > 0)
      .filter((id, index, arr) => arr.indexOf(id) === index)
      .map((eventId) => ({
        loc: buildEventUrl(eventId),
        changefreq: 'daily',
        priority: '0.9',
      }));
  } catch {
    return [];
  }
};

const buildSitemapXml = async () => {
  const urls = [...generateStaticUrls(), ...(await generateEventUrls())];
  const filteredUrls = urls.filter((entry) => {
    const urlPath = new URL(entry.loc).pathname;
    return !privatePaths.has(urlPath) && !urlPath.startsWith('/admin') && !urlPath.startsWith('/organizer') && !urlPath.startsWith('/login') && !urlPath.startsWith('/register') && !urlPath.startsWith('/profile');
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${filteredUrls
  .map(
    (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  return xml;
};

const outputPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');

try {
  const xml = await buildSitemapXml();
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`Generated sitemap with ${xml.split('<url>').length - 1} URLs at ${outputPath}`);
} catch (error) {
  console.error('Failed to generate sitemap:', error);
  process.exit(1);
}

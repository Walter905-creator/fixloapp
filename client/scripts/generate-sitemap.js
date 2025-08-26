const fs=require('fs');const path=require('path');const urls=['/','/signup','/pro/signup','/services','/pro/gallery'];const xml=`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u=>`  <url><loc>https://www.fixloapp.com${u}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join('\n')}
</urlset>
`;const out=path.join(__dirname,'..','public','sitemap.xml');fs.writeFileSync(out,xml,'utf8');console.log('✅ sitemap.xml written to',out,`(${urls.length} URLs)`);
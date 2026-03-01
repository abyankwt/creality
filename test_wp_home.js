const fs = require('fs');
const envObj = {};
const envStr = fs.readFileSync('.env.local', 'utf8');
for (const line of envStr.split('\n')) {
    if (line.includes('=')) {
        const [k, ...v] = line.split('=');
        envObj[k.trim()] = v.join('=').trim().replace(/(^['"\r\n]+)|(['"\r\n]+$)/g, '');
    }
}
async function fetchHeroImages() {
    const baseUrl = envObj.NEXT_PUBLIC_WC_BASE_URL.replace(/\/$/, '');
    const url = baseUrl + '/wp-json/wp/v2/pages?slug=home';
    const res = await fetch(url);
    const data = await res.json();
    const content = data[0].content.rendered;
    fs.writeFileSync('wp_home_content.html', content);

    const matchIter = content.matchAll(/<img[^>]+src=["']([^"']+)["']/g);
    const images = [];
    for (const match of matchIter) {
        if (match[1]) images.push(match[1]);
    }
    console.log('All images found in WP home:', images.slice(0, 10));
}
fetchHeroImages();

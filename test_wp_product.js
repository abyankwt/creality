const fs = require('fs');

const envObj = {};
const envStr = fs.readFileSync('.env.local', 'utf8');
for (const line of envStr.split('\n')) {
    if (line.includes('=')) {
        const [k, ...v] = line.split('=');
        envObj[k.trim()] = v.join('=').trim().replace(/(^['"])|(['"]$)/g, '');
    }
}

async function fetchProducts() {
    try {
        const url = envObj.NEXT_PUBLIC_WC_BASE_URL + '/wp-json/wc/v3/products?per_page=10&consumer_key=' + envObj.WC_CONSUMER_KEY + '&consumer_secret=' + envObj.WC_CONSUMER_SECRET;
        console.log("Fetching URL:", url.split('consumer_key')[0] + '...');
        const res = await fetch(url);
        if (!res.ok) {
            console.error("HTTP error!", res.status, res.statusText);
            return;
        }
        const data = await res.json();

        const products = data.map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            desc_length: p.description?.length,
            short_desc_length: p.short_description?.length
        }));

        console.log("Summary:", JSON.stringify(products, null, 2));
        fs.writeFileSync('wp_products.json', JSON.stringify(data, null, 2));
        console.log("Saved full data to wp_products.json");

        // Also try fetch pages
        const wpUrl = envObj.NEXT_PUBLIC_WC_BASE_URL + '/wp-json/wp/v2/pages?search=sparkx';
        const wpRes = await fetch(wpUrl);
        const wpData = await wpRes.json();
        console.log("\nFound WP Pages matching sparkx:", wpData.map(p => ({ id: p.id, slug: p.slug, title: p.title.rendered })));

    } catch (err) {
        console.error("Error:", err);
    }
}

fetchProducts();

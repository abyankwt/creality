import https from 'https';

https.get('https://creality.com.kw/site/wp-json/wp/v2/pages?slug=home', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const pages = JSON.parse(data);
            if (pages.length > 0) {
                const content = pages[0].content.rendered;
                const matches = content.match(/<img[^>]+src="([^">]+)"/g);

                let imageUrls = [];
                if (matches) {
                    imageUrls = matches.map(m => {
                        const match = m.match(/src="([^">]+)"/);
                        return match ? match[1] : null;
                    }).filter(Boolean);
                }
                console.log("Found slider images in Home Page:");
                console.log(JSON.stringify(imageUrls, null, 2));
            }
        } catch (e) {
            console.error(e);
        }
    });
});

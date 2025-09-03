// Используем puppeteer-core вместо puppeteer
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Конфигурация продуктов
const PRODUCTS_CONFIG = {
    "арматура": {
        "арматура 8мм": [
            {
                "url": "https://tyumen.spk.ru/product/armatura-8-6m-a500-34028-16/",
                "selector": "div.product-m__price > div > div.product-m__price-value > span"
            },
            {
                "url": "https://72parad.ru/metalloprokat/armatura/armatura-8mm/armatura-8mm-6m",
                "selector": "li > h2"
            },
            {
                "url": "https://trimet.ru/catalog/metalloprokat/sortovoy_prokat/armatura/armatura_a500s_8_st_3sp_ps_gost_52544_2006_gost_34028_2016/",
                "selector": "div.product__price > div > div:nth-child(2) > p:nth-child(2) > strong"
            }
        ]
    },
    "труба профильная": {
        "40*20*2": [
            {
                "url": "https://trimet.ru/catalog/metalloprokat/trubnyy_prokat/truba_profilnaya/truby_profilnye_40_20_2_st_0_2_3_10_20/",
                "selector": "div.product__price > div > div:nth-child(2) > p:nth-child(2) > strong"
            },
            {
                "url": "https://72parad.ru/metalloprokat/truba-profilnaya/truba-profilnaya-40x40/truba-profilnaya-40mm-40mm-2mm-6m",
                "selector": "li > h2"
            },
            {
                "url": "https://tyumen.spk.ru/product/truba-profilnaya-40x20x2-gost/",
                "selector": "div.product-m__price > div > div.product-m__price-value > span"
            }
        ]
    }
};

const PARSER_CONFIG = {
    timeout: 30000,
    waitTime: 5000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

function extractPrice(text) {
    if (!text) return null;
    const cleaned = text.replace(/[^\d,.]/g, '').replace(',', '.');
    const numbers = cleaned.match(/\d+\.?\d*/);
    return numbers ? parseFloat(numbers[0]) : null;
}

async function parsePrice(url, selector) {
    console.log(`🔄 Парсим: ${url}`);
    
    // Путь к системному Chrome
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
                          '/usr/bin/chromium-browser';

    const browser = await puppeteer.launch({
        executablePath: executablePath,
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--user-agent=' + PARSER_CONFIG.userAgent,
            '--window-size=1920,1080'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setBypassCSP(true);
        await page.setUserAgent(PARSER_CONFIG.userAgent);
        await page.setViewport({ width: 1920, height: 1080 });

        console.log(`🌐 Открываем страницу: ${url}`);
        await page.goto(url, { 
            waitUntil: 'networkidle2', 
            timeout: PARSER_CONFIG.timeout 
        });

        console.log(`⏳ Ждем загрузки...`);
        await page.waitForTimeout(PARSER_CONFIG.waitTime);

        console.log(`🔍 Ищем селектор: ${selector}`);
        const element = await page.$(selector);
        
        if (!element) {
            console.log('❌ Элемент не найден');
            return null;
        }

        const priceText = await page.evaluate(el => el.textContent, element);
        console.log(`📄 Найден текст: "${priceText}"`);

        const price = extractPrice(priceText);
        console.log(price ? `✅ Цена найдена: ${price}` : '❌ Не удалось извлечь цену');

        return price;

    } catch (error) {
        console.error(`❌ Ошибка при парсинге ${url}:`, error.message);
        return null;
    } finally {
        await browser.close();
    }
}

async function main() {
    console.log('🚀 Запуск Puppeteer парсера...');
    
    const results = {
        last_updated: new Date().toISOString(),
        products: {}
    };

    const resultsDir = path.join(__dirname, '../results');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }

    for (const [category, products] of Object.entries(PRODUCTS_CONFIG)) {
        results.products[category] = {};
        
        for (const [productName, sources] of Object.entries(products)) {
            results.products[category][productName] = {};
            
            console.log(`\n📦 Категория: ${category} -> ${productName}`);

            for (let i = 0; i < sources.length; i++) {
                const source = sources[i];
                const domain = new URL(source.url).hostname;
                const sourceKey = `${domain}_${i}`;

                const price = await parsePrice(source.url, source.selector);
                
                results.products[category][productName][sourceKey] = {
                    price: price,
                    url: source.url,
                    selector: source.selector,
                    success: price !== null,
                    timestamp: new Date().toISOString()
                };
            }
        }
    }

    const outputPath = path.join(resultsDir, 'prices.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    console.log('\n🎉 Парсинг завершен!');
    console.log(`📁 Результаты сохранены в: ${outputPath}`);
}

main().catch(error => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
});

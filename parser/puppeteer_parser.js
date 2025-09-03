const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { PRODUCTS_CONFIG, PARSER_CONFIG } = require('./config');

// Функция для извлечения цены из текста
function extractPrice(text) {
    if (!text) return null;
    
    // Убираем все нечисловые символы кроме точки и запятой
    const cleaned = text.replace(/[^\d,.]/g, '').replace(',', '.');
    
    // Ищем числа
    const numbers = cleaned.match(/\d+\.?\d*/);
    return numbers ? parseFloat(numbers[0]) : null;
}

// Основная функция парсинга
async function parsePrice(url, selector) {
    console.log(`🔄 Парсим: ${url}`);
    
    const browser = await puppeteer.launch({
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
        
        // Настраиваем страницу
        await page.setBypassCSP(true);
        await page.setUserAgent(PARSER_CONFIG.userAgent);
        await page.setViewport({ width: 1920, height: 1080 });

        // Переходим на страницу
        console.log(`🌐 Открываем страницу: ${url}`);
        await page.goto(url, { 
            waitUntil: 'networkidle2', 
            timeout: PARSER_CONFIG.timeout 
        });

        // Ждем загрузки
        console.log(`⏳ Ждем загрузки...`);
        await page.waitForTimeout(PARSER_CONFIG.waitTime);

        // Пробуем найти элемент по селектору
        console.log(`🔍 Ищем селектор: ${selector}`);
        const element = await page.$(selector);
        
        if (!element) {
            console.log('❌ Элемент не найден');
            return null;
        }

        // Получаем текст элемента
        const priceText = await page.evaluate(el => el.textContent, element);
        console.log(`📄 Найден текст: "${priceText}"`);

        // Извлекаем цену
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

// Главная функция
async function main() {
    console.log('🚀 Запуск Puppeteer парсера...');
    console.log('========================================');

    const results = {
        last_updated: new Date().toISOString(),
        products: {}
    };

    // Создаем папку results если её нет
    const resultsDir = path.join(__dirname, '../results');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Парсим все продукты
    for (const [category, products] of Object.entries(PRODUCTS_CONFIG)) {
        results.products[category] = {};
        
        for (const [productName, sources] of Object.entries(products)) {
            results.products[category][productName] = {};
            
            console.log(`\n📦 Категория: ${category} -> ${productName}`);
            console.log('----------------------------------------');

            for (let i = 0; i < sources.length; i++) {
                const source = sources[i];
                const domain = new URL(source.url).hostname;
                const sourceKey = `${domain}_${i}`;

                console.log(`\n🔗 URL: ${source.url}`);
                console.log(`🎯 Селектор: ${source.selector}`);

                const price = await parsePrice(source.url, source.selector);
                
                results.products[category][productName][sourceKey] = {
                    price: price,
                    url: source.url,
                    selector: source.selector,
                    success: price !== null,
                    timestamp: new Date().toISOString()
                };

                console.log(price !== null ? '✅ Успешно' : '❌ Не удалось');
            }
        }
    }

    // Сохраняем результаты
    const outputPath = path.join(resultsDir, 'prices.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    console.log('\n========================================');
    console.log('🎉 Парсинг завершен!');
    console.log(`📁 Результаты сохранены в: ${outputPath}`);

    // Статистика
    let total = 0;
    let success = 0;

    for (const category of Object.values(results.products)) {
        for (const product of Object.values(category)) {
            for (const item of Object.values(product)) {
                total++;
                if (item.success) success++;
            }
        }
    }

    console.log(`📊 Статистика: ${success}/${total} успешно`);
}

// Обработка ошибок
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Запуск
main().catch(error => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
});

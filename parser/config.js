// Конфигурация продуктов для парсинга
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

// Настройки парсера
const PARSER_CONFIG = {
    timeout: 30000,
    waitTime: 5000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

module.exports = {
    PRODUCTS_CONFIG,
    PARSER_CONFIG
};

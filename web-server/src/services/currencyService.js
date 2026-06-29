const BASE_CURRENCY = 'ILS';
const SUPPORTED_CURRENCIES = ['ILS', 'USD', 'EUR', 'GBP'];
const CACHE_DURATION_MS = 12 * 60 * 60 * 1000;

let cachedRates = null;

function buildDefaultRates() {
    return {
        ILS: 1
    };
}

function normalizeRateRecords(records) {
    const rates = buildDefaultRates();

    if (!Array.isArray(records)) {
        return rates;
    }

    records.forEach((record) => {
        const quote = String(record?.quote || '').toUpperCase();
        const rate = Number(record?.rate);

        if (
            SUPPORTED_CURRENCIES.includes(quote) &&
            Number.isFinite(rate) &&
            rate > 0
        ) {
            rates[quote] = rate;
        }
    });

    return rates;
}

function hasAllSupportedRates(rates) {
    return SUPPORTED_CURRENCIES.every((currency) => {
        const rate = Number(rates?.[currency]);

        return Number.isFinite(rate) && rate > 0;
    });
}

function getCachedResponse(source = 'cache') {
    if (!cachedRates) {
        return null;
    }

    return {
        baseCurrency: BASE_CURRENCY,
        rates: cachedRates.rates,
        updatedAt: cachedRates.updatedAt,
        source
    };
}

async function fetchLiveRates() {
    const quotes = SUPPORTED_CURRENCIES
        .filter((currency) => currency !== BASE_CURRENCY)
        .join(',');

    const response = await fetch(
        `https://api.frankfurter.dev/v2/rates?base=${BASE_CURRENCY}&quotes=${quotes}`,
        {
            headers: {
                Accept: 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            `Currency provider request failed with status ${response.status}`
        );
    }

    const records = await response.json();
    const rates = normalizeRateRecords(records);

    if (!hasAllSupportedRates(rates)) {
        throw new Error(
            'Currency provider response did not include all supported rates'
        );
    }

    const updatedAt = new Date().toISOString();

    cachedRates = {
        rates,
        updatedAt,
        expiresAt: Date.now() + CACHE_DURATION_MS
    };

    return {
        baseCurrency: BASE_CURRENCY,
        rates,
        updatedAt,
        source: 'live'
    };
}

async function getExchangeRates() {
    if (cachedRates && cachedRates.expiresAt > Date.now()) {
        return getCachedResponse('cache');
    }

    try {
        return await fetchLiveRates();
    } catch (error) {
        const staleCacheResponse = getCachedResponse('stale-cache');

        if (staleCacheResponse) {
            return staleCacheResponse;
        }

        throw error;
    }
}

module.exports = {
    BASE_CURRENCY,
    SUPPORTED_CURRENCIES,
    getExchangeRates
};

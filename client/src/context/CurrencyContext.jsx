import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { getCurrencyRates } from '../api/currencyApi.js';

const STORAGE_KEY = 'selectedCurrency';
const BASE_CURRENCY = 'ILS';
const FALLBACK_RATES = {
  ILS: 1
};

const CurrencyContext = createContext(null);

function normalizeCurrency(value) {
  return String(value || '').trim().toUpperCase();
}

function getSavedCurrency() {
  try {
    return normalizeCurrency(
      localStorage.getItem(STORAGE_KEY)
    ) || BASE_CURRENCY;
  } catch {
    return BASE_CURRENCY;
  }
}

function getLocaleForCurrency(currency) {
  const locales = {
    ILS: 'he-IL',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB'
  };

  return locales[currency] || 'en-US';
}

export function CurrencyProvider({ children }) {
  const [selectedCurrency, setSelectedCurrencyState] = useState(
    getSavedCurrency
  );

  const [rates, setRates] = useState(FALLBACK_RATES);
  const [rateStatus, setRateStatus] = useState('loading');
  const [rateUpdatedAt, setRateUpdatedAt] = useState(null);

  const refreshRates = useCallback(async () => {
    setRateStatus('loading');

    try {
      const response = await getCurrencyRates();
      const nextRates = {
        ...FALLBACK_RATES,
        ...(response?.rates || {})
      };

      setRates(nextRates);
      setRateUpdatedAt(response?.updatedAt || null);
      setRateStatus('ready');

      const supportedCurrencies = Object.keys(nextRates);

      setSelectedCurrencyState((currentCurrency) =>
        supportedCurrencies.includes(currentCurrency)
          ? currentCurrency
          : BASE_CURRENCY
      );
    } catch {
      setRates(FALLBACK_RATES);
      setRateUpdatedAt(null);
      setRateStatus('error');
      setSelectedCurrencyState(BASE_CURRENCY);
    }
  }, []);

  useEffect(() => {
    refreshRates();
  }, [refreshRates]);

  const setSelectedCurrency = useCallback((currency) => {
    const normalizedCurrency = normalizeCurrency(currency);

    setSelectedCurrencyState((currentCurrency) => {
      const nextCurrency =
        Number(rates?.[normalizedCurrency]) > 0
          ? normalizedCurrency
          : currentCurrency;

      try {
        localStorage.setItem(STORAGE_KEY, nextCurrency);
      } catch {
        // The current session still keeps the selected value.
      }

      return nextCurrency;
    });
  }, [rates]);

  const convertFromIls = useCallback((amount) => {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
      return 0;
    }

    const rate = Number(rates?.[selectedCurrency]);

    if (!Number.isFinite(rate) || rate <= 0) {
      return numericAmount;
    }

    return numericAmount * rate;
  }, [rates, selectedCurrency]);

  const formatPrice = useCallback((amount) => {
    const currency =
      Number(rates?.[selectedCurrency]) > 0
        ? selectedCurrency
        : BASE_CURRENCY;

    return new Intl.NumberFormat(
      getLocaleForCurrency(currency),
      {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    ).format(convertFromIls(amount));
  }, [convertFromIls, rates, selectedCurrency]);

  const supportedCurrencies = useMemo(
    () => Object.keys(rates).filter(
      (currency) => Number(rates[currency]) > 0
    ),
    [rates]
  );

  const value = useMemo(
    () => ({
      baseCurrency: BASE_CURRENCY,
      selectedCurrency,
      supportedCurrencies,
      rates,
      rateStatus,
      rateUpdatedAt,
      setSelectedCurrency,
      refreshRates,
      convertFromIls,
      formatPrice
    }),
    [
      convertFromIls,
      formatPrice,
      rateStatus,
      rateUpdatedAt,
      rates,
      refreshRates,
      selectedCurrency,
      setSelectedCurrency,
      supportedCurrencies
    ]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error(
      'useCurrency must be used inside CurrencyProvider.'
    );
  }

  return context;
}

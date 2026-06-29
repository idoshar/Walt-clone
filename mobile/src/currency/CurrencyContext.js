import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import { getCurrencyRates } from '../api/currency';

const STORAGE_KEY = '@wolt_delivery_selected_currency';
const BASE_CURRENCY = 'ILS';
const FALLBACK_RATES = {
  ILS: 1
};

const CurrencyContext = createContext(null);

function normalizeCurrency(value) {
  return String(value || '').trim().toUpperCase();
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
    BASE_CURRENCY
  );

  const [rates, setRates] = useState(FALLBACK_RATES);
  const [rateStatus, setRateStatus] = useState('loading');
  const [isRestoringCurrency, setIsRestoringCurrency] = useState(true);

  const refreshRates = useCallback(async () => {
    setRateStatus('loading');

    try {
      const response = await getCurrencyRates();

      setRates({
        ...FALLBACK_RATES,
        ...(response?.rates || {})
      });

      setRateStatus('ready');
    } catch {
      setRates(FALLBACK_RATES);
      setRateStatus('error');
      setSelectedCurrencyState(BASE_CURRENCY);
    }
  }, []);

  useEffect(() => {
    async function restoreCurrency() {
      try {
        const storedCurrency = normalizeCurrency(
          await AsyncStorage.getItem(STORAGE_KEY)
        );

        if (storedCurrency) {
          setSelectedCurrencyState(storedCurrency);
        }
      } finally {
        setIsRestoringCurrency(false);
      }
    }

    restoreCurrency();
  }, []);

  useEffect(() => {
    refreshRates();
  }, [refreshRates]);

  useEffect(() => {
    if (Number(rates?.[selectedCurrency]) > 0) {
      return;
    }

    setSelectedCurrencyState(BASE_CURRENCY);
  }, [rates, selectedCurrency]);

  const setSelectedCurrency = useCallback(async (currency) => {
    const normalizedCurrency = normalizeCurrency(currency);

    if (Number(rates?.[normalizedCurrency]) <= 0) {
      return;
    }

    setSelectedCurrencyState(normalizedCurrency);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        normalizedCurrency
      );
    } catch {
      // The preference still applies for the current app session.
    }
  }, [rates]);

  const convertFromIls = useCallback((amount) => {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
      return 0;
    }

    const rate = Number(rates?.[selectedCurrency]);

    return Number.isFinite(rate) && rate > 0
      ? numericAmount * rate
      : numericAmount;
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
      rateStatus,
      isRestoringCurrency,
      setSelectedCurrency,
      refreshRates,
      convertFromIls,
      formatPrice
    }),
    [
      convertFromIls,
      formatPrice,
      isRestoringCurrency,
      rateStatus,
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

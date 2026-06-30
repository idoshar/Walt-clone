import { useCurrency } from '../context/CurrencyContext.jsx';

const CURRENCY_OPTIONS = {
  ILS: {
    label: 'Israeli new shekel',
    symbol: '₪'
  },
  USD: {
    label: 'US dollar',
    symbol: '$'
  },
  EUR: {
    label: 'Euro',
    symbol: '€'
  },
  GBP: {
    label: 'British pound',
    symbol: '£'
  }
};

function CurrencyFlag({ currency }) {
  if (currency === 'ILS') {
    return (
      <svg
        className="currency-selector-flag-icon"
        viewBox="0 0 36 24"
        aria-hidden="true"
      >
        <rect width="36" height="24" fill="#ffffff" />
        <rect y="2" width="36" height="3" fill="#0038b8" />
        <rect y="19" width="36" height="3" fill="#0038b8" />
        <path
          d="M18 7.3 23.1 16.1H12.9L18 7.3Zm0 9.4-5.1-8.8h10.2L18 16.7Z"
          fill="#0038b8"
        />
      </svg>
    );
  }

  if (currency === 'USD') {
    return (
      <svg
        className="currency-selector-flag-icon"
        viewBox="0 0 36 24"
        aria-hidden="true"
      >
        <rect width="36" height="24" fill="#ffffff" />
        <path
          d="M0 0h36v2H0zm0 4h36v2H0zm0 8h36v2H0zm0 4h36v2H0zm0 4h36v2H0z"
          fill="#b22234"
        />
        <rect width="16" height="13" fill="#3c3b6e" />
        <path
          d="m3 3 .8 1.7L5.7 5l-1.4 1.2.4 1.8L3 7.1 1.3 8l.4-1.8L.3 5l1.9-.3L3 3Zm6 0 .8 1.7 1.9.3-1.4 1.2.4 1.8L9 7.1 7.3 8l.4-1.8L6.3 5l1.9-.3L9 3Zm3 5 .8 1.7 1.9.3-1.4 1.2.4 1.8L12 12.1l-1.7.9.4-1.8L9.3 10l1.9-.3L12 8Z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  if (currency === 'EUR') {
    return (
      <svg
        className="currency-selector-flag-icon"
        viewBox="0 0 36 24"
        aria-hidden="true"
      >
        <rect width="36" height="24" fill="#003399" />
        <g fill="#ffcc00">
          <circle cx="18" cy="4.4" r="1" />
          <circle cx="21.8" cy="5.4" r="1" />
          <circle cx="24.6" cy="8.2" r="1" />
          <circle cx="25.6" cy="12" r="1" />
          <circle cx="24.6" cy="15.8" r="1" />
          <circle cx="21.8" cy="18.6" r="1" />
          <circle cx="18" cy="19.6" r="1" />
          <circle cx="14.2" cy="18.6" r="1" />
          <circle cx="11.4" cy="15.8" r="1" />
          <circle cx="10.4" cy="12" r="1" />
          <circle cx="11.4" cy="8.2" r="1" />
          <circle cx="14.2" cy="5.4" r="1" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      className="currency-selector-flag-icon"
      viewBox="0 0 36 24"
      aria-hidden="true"
    >
      <rect width="36" height="24" fill="#012169" />
      <path d="M0 0 36 24M36 0 0 24" stroke="#ffffff" strokeWidth="6" />
      <path d="M0 0 36 24M36 0 0 24" stroke="#c8102e" strokeWidth="2.5" />
      <path d="M18 0v24M0 12h36" stroke="#ffffff" strokeWidth="8" />
      <path d="M18 0v24M0 12h36" stroke="#c8102e" strokeWidth="4" />
    </svg>
  );
}

function CurrencySelector() {
  const {
    selectedCurrency,
    supportedCurrencies,
    rateStatus,
    setSelectedCurrency
  } = useCurrency();

  const isLoading = rateStatus === 'loading';

  return (
    <label className="currency-selector">
      <span className="currency-selector-label">Currency</span>
      <span className="currency-selector-flag" aria-hidden="true">
        <CurrencyFlag currency={selectedCurrency} />
      </span>

      <select
        aria-label="Display currency"
        className="currency-selector-control"
        disabled={isLoading}
        onChange={(event) => setSelectedCurrency(event.target.value)}
        value={selectedCurrency}
      >
        {supportedCurrencies.map((currency) => {
          const option = CURRENCY_OPTIONS[currency];

          return (
            <option
              key={currency}
              value={currency}
              aria-label={option?.label || currency}
            >
              {option ? `${currency} · ${option.symbol}` : currency}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export default CurrencySelector;

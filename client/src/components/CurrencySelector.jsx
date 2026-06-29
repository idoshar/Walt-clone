import { useCurrency } from '../context/CurrencyContext.jsx';

const CURRENCY_OPTIONS = {
  ILS: {
    label: '🇮🇱 ₪',
    accessibleLabel: 'Israeli new shekel'
  },
  USD: {
    label: '🇺🇸 $',
    accessibleLabel: 'US dollar'
  },
  EUR: {
    label: '🇪🇺 €',
    accessibleLabel: 'Euro'
  },
  GBP: {
    label: '🇬🇧 £',
    accessibleLabel: 'British pound'
  }
};

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
      <span className="currency-selector-label">
        Currency
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
              aria-label={option?.accessibleLabel || currency}
            >
              {option?.label || currency}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export default CurrencySelector;

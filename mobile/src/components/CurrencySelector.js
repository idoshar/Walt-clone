import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCurrency } from '../currency/CurrencyContext';
import { useAppTheme } from '../theme/ThemeContext';

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

export default function CurrencySelector() {
  const {
    selectedCurrency,
    supportedCurrencies,
    rateStatus,
    setSelectedCurrency
  } = useCurrency();

  const { theme } = useAppTheme();

  return (
    <View
      accessibilityLabel="Display currency"
      style={styles.container}
    >
      <Text
        style={[
          styles.label,
          { color: theme.colors.textMuted }
        ]}
      >
        Currency
      </Text>

      <View style={styles.options}>
        {supportedCurrencies.map((currency) => {
          const isSelected = currency === selectedCurrency;
          const option = CURRENCY_OPTIONS[currency];

          return (
            <Pressable
              key={currency}
              accessibilityLabel={
                option?.accessibleLabel || currency
              }
              accessibilityRole="button"
              accessibilityState={{
                disabled: rateStatus === 'loading',
                selected: isSelected
              }}
              disabled={rateStatus === 'loading'}
              onPress={() => setSelectedCurrency(currency)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                  opacity: pressed ? 0.8 : 1
                }
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: isSelected
                      ? theme.colors.primaryText
                      : theme.colors.text
                  }
                ]}
              >
                {option?.label || currency}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  option: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  optionText: {
    fontSize: 13,
    fontWeight: '800'
  }
});

import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../theme/ThemeContext';
import {
  getProductFallbackImage,
  getProductImage,
} from '../utils/productImages';

function getImageIdentity(product = {}) {
  return [
    product?.id || product?._id || '',
    product?.name || '',
    product?.image || '',
  ].join('|');
}

export default function ProductImage({
  product,
  style,
  placeholderStyle,
  iconStyle,
  resizeMode = 'cover',
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);
  const identity = getImageIdentity(product);
  const [failedSource, setFailedSource] = useState('');
  const [failedFallback, setFailedFallback] = useState(false);

  const sourceUri = getProductImage(product);
  const fallbackUri = getProductFallbackImage(product);
  const isUsingFallback = failedSource === identity;
  const displayUri = isUsingFallback ? fallbackUri : sourceUri;

  useEffect(() => {
    setFailedSource('');
    setFailedFallback(false);
  }, [identity]);

  function handleImageError() {
    if (!isUsingFallback && sourceUri !== fallbackUri) {
      setFailedSource(identity);
      return;
    }

    setFailedFallback(true);
  }

  if (failedFallback || !displayUri) {
    return (
      <View
        accessibilityLabel={`${product?.name || 'Product'} image placeholder`}
        style={[styles.placeholder, style, placeholderStyle]}
      >
        <Text style={[styles.placeholderIcon, iconStyle]}>🍽️</Text>
      </View>
    );
  }

  return (
    <Image
      accessibilityLabel={`${product?.name || 'Product'} image`}
      onError={handleImageError}
      resizeMode={resizeMode}
      source={{ uri: displayUri }}
      style={style}
    />
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    placeholder: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    placeholderIcon: {
      fontSize: 26,
    },
  });
}

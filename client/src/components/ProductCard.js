import React from 'react';

const ProductCard = ({ product }) => {
  const defaultImage = 'https://via.placeholder.com/100?text=Food';

  return (
    <div style={styles.card}>
      <div style={styles.details}>
        <h4 style={styles.name}>{product.name}</h4>
        <p style={styles.description}>{product.description || 'מנה טעימה מחומרי גלם טריים'}</p>
        <span style={styles.price}>₪{product.price}</span>
      </div>
      <img 
        src={product.image || defaultImage} 
        alt={product.name} 
        style={styles.image} 
      />
    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    direction: 'rtl',
    border: '1px solid #f0f0f0'
  },
  details: {
    flex: 1,
    paddingLeft: '12px',
  },
  name: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: '600',
  },
  description: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    color: '#737373',
    lineHeight: '1.4',
  },
  price: {
    fontWeight: 'bold',
    color: '#2b2b2b',
    fontSize: '15px',
  },
  image: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    objectFit: 'cover',
  }
};

export default ProductCard;
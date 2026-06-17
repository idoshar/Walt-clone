import React from 'react';

const RestaurantCard = ({ restaurant }) => {
  // הגדרת תמונת ברירת מחדל במידה ואין תמונה מהשרת
  const defaultImage = 'https://via.placeholder.com/300x180?text=No+Image';

  return (
    <div style={styles.card}>
      <img 
        src={restaurant.image || defaultImage} 
        alt={restaurant.name} 
        style={styles.image} 
      />
      <div style={styles.info}>
        <h3 style={styles.name}>{restaurant.name}</h3>
        <p style={styles.category}>{restaurant.category || 'מסעדה'}</p>
        <div style={styles.footerRow}>
          <span style={styles.rating}>⭐ {restaurant.rating || '4.5'}</span>
          <span style={styles.deliveryTime}>🕒 20-30 דק׳</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    width: '100%',
    direction: 'rtl'
  },
  image: {
    width: '100%',
    height: '160px',
    objectFit: 'cover',
  },
  info: {
    padding: '12px',
  },
  name: {
    margin: '0 0 4px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2b2b2b',
  },
  category: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#737373',
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
  },
  rating: {
    backgroundColor: '#f3f3f3',
    padding: '4px 8px',
    borderRadius: '6px',
    fontWeight: '600',
  },
  deliveryTime: {
    color: '#1470e2',
    fontWeight: '500',
  }
};

export default RestaurantCard;
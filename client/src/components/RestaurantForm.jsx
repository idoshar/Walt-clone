import { useState } from 'react';

function RestaurantForm({ initialRestaurant, onSubmit }) {
  const [restaurant, setRestaurant] = useState({
    name: initialRestaurant?.name || '',
    address: initialRestaurant?.address || '',
    phone: initialRestaurant?.phone || '',
    cuisine: initialRestaurant?.cuisine || '',
    description: initialRestaurant?.description || ''
  });

  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;

    setRestaurant((current) => ({
      ...current,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((current) => ({
        ...current,
        [name]: ''
      }));
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    
    const newErrors = {};
    if (!restaurant.name.trim()) newErrors.name = 'Restaurant name is required';
    if (!restaurant.address.trim()) newErrors.address = 'Address is required';
    if (!restaurant.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!restaurant.cuisine.trim()) newErrors.cuisine = 'Cuisine type is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(restaurant);
    setErrors({});
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.inputGroup}>
        <input
          name="name"
          placeholder="Restaurant name"
          value={restaurant.name}
          onChange={handleChange}
          style={errors.name ? styles.inputError : styles.input}
        />
        {errors.name && <span style={styles.errorText}>{errors.name}</span>}
      </div>

      <div style={styles.inputGroup}>
        <input
          name="address"
          placeholder="Address"
          value={restaurant.address}
          onChange={handleChange}
          style={errors.address ? styles.inputError : styles.input}
        />
        {errors.address && <span style={styles.errorText}>{errors.address}</span>}
      </div>

      <div style={styles.inputGroup}>
        <input
          name="phone"
          placeholder="Phone"
          value={restaurant.phone}
          onChange={handleChange}
          style={errors.phone ? styles.inputError : styles.input}
        />
        {errors.phone && <span style={styles.errorText}>{errors.phone}</span>}
      </div>

      <div style={styles.inputGroup}>
        <input
          name="cuisine"
          placeholder="Cuisine"
          value={restaurant.cuisine}
          onChange={handleChange}
          style={errors.cuisine ? styles.inputError : styles.input}
        />
        {errors.cuisine && <span style={styles.errorText}>{errors.cuisine}</span>}
      </div>

      <div style={styles.inputGroup}>
        <textarea
          name="description"
          placeholder="Description"
          value={restaurant.description}
          onChange={handleChange}
          style={styles.textarea}
        />
      </div>

      <button type="submit" style={styles.button}>
        Save Restaurant
      </button>
    </form>
  );
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    maxWidth: '400px',
    width: '100%'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  input: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px'
  },
  inputError: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ef4444',
    fontSize: '14px',
    backgroundColor: '#fef2f2'
  },
  textarea: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    minHeight: '8px',
    fontFamily: 'inherit'
  },
  errorText: {
    color: '#ef4444',
    fontSize: '12px',
    fontWeight: '500'
  },
  button: {
    backgroundColor: '#009de0',
    color: '#ffffff',
    border: 'none',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default RestaurantForm;
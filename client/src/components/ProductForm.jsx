import { useState } from 'react';

function ProductForm({ initialProduct, onSubmit }) {
  const [product, setProduct] = useState({
    name: initialProduct?.name || '',
    description: initialProduct?.description || '',
    price: initialProduct?.price || '',
    image: initialProduct?.image || ''
  });

  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;

    setProduct((current) => ({
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
    if (!product.name.trim()) newErrors.name = 'Product name is required';
    if (!product.price || Number(product.price) <= 0) {
      newErrors.price = 'Price must be a valid positive number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      ...product,
      price: Number(product.price)
    });

    setErrors({});
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.inputGroup}>
        <input 
          name="name" 
          placeholder="Product name" 
          value={product.name} 
          onChange={handleChange} 
          style={errors.name ? styles.inputError : styles.input}
        />
        {errors.name && <span style={styles.errorText}>{errors.name}</span>}
      </div>

      <div style={styles.inputGroup}>
        <input 
          name="description" 
          placeholder="Description" 
          value={product.description} 
          onChange={handleChange} 
          style={styles.input}
        />
      </div>

      <div style={styles.inputGroup}>
        <input 
          name="price" 
          placeholder="Price" 
          type="number" 
          value={product.price} 
          onChange={handleChange} 
          style={errors.price ? styles.inputError : styles.input}
        />
        {errors.price && <span style={styles.errorText}>{errors.price}</span>}
      </div>

      <div style={styles.inputGroup}>
        <input 
          name="image" 
          placeholder="Image URL" 
          value={product.image} 
          onChange={handleChange} 
          style={styles.input}
        />
      </div>

      <button type="submit" style={styles.button}>Save Product</button>
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

export default ProductForm;
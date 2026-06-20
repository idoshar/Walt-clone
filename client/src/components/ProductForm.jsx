import { useState } from 'react';

function ProductForm({ initialProduct, onSubmit }) {
  const [product, setProduct] = useState({
    name: initialProduct?.name || '',
    description: initialProduct?.description || '',
    price: initialProduct?.price || '',
    image: initialProduct?.image || ''
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setProduct((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    onSubmit({
      ...product,
      price: Number(product.price)
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Product name" value={product.name} onChange={handleChange} />
      <input name="description" placeholder="Description" value={product.description} onChange={handleChange} />
      <input name="price" placeholder="Price" type="number" value={product.price} onChange={handleChange} />
      <input name="image" placeholder="Image URL" value={product.image} onChange={handleChange} />

      <button type="submit">Save Product</button>
    </form>
  );
}

export default ProductForm;
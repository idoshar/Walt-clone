function RestaurantManagementPage() {
  return (
    <main className="page">
      <section className="page-header">
        <h1>Restaurant Management</h1>
        <p>Add restaurants, edit restaurant details and manage menu items.</p>
      </section>

      <section className="management-actions">
        <button type="button" className="primary-button">
          Add Restaurant
        </button>

        <button type="button" className="secondary-button">
          Manage Products
        </button>
      </section>
    </main>
  );
}

export default RestaurantManagementPage;
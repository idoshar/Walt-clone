import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <section className="page-container">
      <h1>Page not found</h1>
      <Link to="/">Back to home page</Link>
    </section>
  );
}

export default NotFoundPage;

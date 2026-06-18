function ErrorMessage({ message = 'Something went wrong.' }) {
  return (
    <div className="state-box error-box" role="alert">
      <strong>Error</strong>
      <p>{message}</p>
    </div>
  );
}

export default ErrorMessage;

function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="state-box loading-box">
      <div className="spinner" aria-hidden="true"></div>
      <p>{message}</p>
    </div>
  );
}

export default LoadingState;

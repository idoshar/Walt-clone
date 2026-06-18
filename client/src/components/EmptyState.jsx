function EmptyState({
  title = 'Nothing to show yet',
  message = 'Try again later or change your search.'
}) {
  return (
    <div className="state-box empty-box">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

export default EmptyState;

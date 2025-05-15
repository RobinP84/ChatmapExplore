function AppButton({ handleClick, children }) {
  return (
    <button
      className="app-button"
      onClick={handleClick}
      style={{
        padding: '8px 16px',
        margin: '4px',
        borderRadius: '4px',
        background: '#1976d2',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export default AppButton;
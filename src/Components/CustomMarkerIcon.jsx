import './CustomMarkerIcon.css';

export const MakePostIcon = (props) => {
  const style = {
    width: '32px',
    height: '32px',
    // Uncomment or add animation styles if needed:
    // transformOrigin: '0% 100%',
    // animation: 'rotateAnimation 3s linear infinite',
  };

  return (
    <svg
      {...props}
      style={style}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.5863 26.9999H6C5.73478 26.9999 5.48043 26.8946 5.29289 26.707C5.10536 26.5195 5 26.2651 5 25.9999V20.4137C5.00012 20.1488 5.10532 19.8948 5.2925 19.7074L20.7075 4.29242C20.895 4.10502 21.1493 3.99976 21.4144 3.99976C21.6795 3.99976 21.9337 4.10502 22.1213 4.29242L27.7075 9.87492C27.8949 10.0624 28.0002 10.3167 28.0002 10.5818C28.0002 10.8469 27.8949 11.1011 27.7075 11.2887L12.2925 26.7074C12.1051 26.8946 11.8511 26.9998 11.5863 26.9999Z"
        stroke="#343330"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M17 8L24 15"
        stroke="#343330"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

// Monochrome symbols to ensure they're always black
const CATEGORY_SYMBOLS = {
  news: 'N',
  sports: 'S',
  tech: 'T',
  nightlife: '★',
};

export const PostMarkerIcon = ({ color = '#343330', category, ...props }) => {
  const style = {
    width: '48px',
    height: '48px',
  };

  const symbol = CATEGORY_SYMBOLS[category] || '•';

  return (
    <svg
      {...props}
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Drop/pin shape with darker gray body */}
      <path
        d="M12 2C7.58 2 4 5.51 4 9.83c0 4.4 3.74 8.64 7.06 11.37.55.45 1.33.45 1.88 0C16.26 18.47 20 14.23 20 9.83 20 5.51 16.42 2 12 2Z"
        fill="#bdbdbd"
        stroke="none"
      />
      {/* Colored circle behind symbol (smaller to show more gray) */}
      <circle cx="12" cy="11" r="5.75" fill={color} />
      {/* Symbol centered inside, forced to black */}
      <text
        x="12"
        y="12.4"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9"
        fontWeight="700"
        fill="#000"
      >
        {symbol}
      </text>
    </svg>
  );
}

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

export const PostMarkerIcon = (props) => {
  const style = {
    width: '32px',
    height: '32px',
    // Custom styling or animations specific to this icon.
  };

  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.51612 13.7096C10.9367 13.7096 13.7097 10.9367 13.7097 7.51606C13.7097 4.09546 10.9367 1.32251 7.51612 1.32251C4.09552 1.32251 1.32257 4.09546 1.32257 7.51606C1.32257 10.9367 4.09552 13.7096 7.51612 13.7096Z" stroke="#343330" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>


  );
};
import React from 'react';
import QRCode from 'qrcode';

const QRCodeComponent = ({
  value,
  size = 200,
  color = '#000',
  backgroundColor = '#fff',
}) => {
  const [dataUrl, setDataUrl] = React.useState('');

  React.useEffect(() => {
    if (value) {
      QRCode.toDataURL(value, {
        width: size,
        margin: 0,
        color: {
          dark: color,
          light: backgroundColor,
        },
      })
        .then(url => setDataUrl(url))
        .catch(err => console.error('Error generating QR code:', err));
    }
  }, [value, size, color, backgroundColor]);

  if (!dataUrl) return null;

  return (
    <img src={dataUrl} alt="QR Code" style={{ width: size, height: size }} />
  );
};

export default QRCodeComponent;

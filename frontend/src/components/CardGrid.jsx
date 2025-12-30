/* eslint-disable react/prop-types */
const CardGrid = ({ children }) => {
  return (
    <div 
      style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 380px))',
        gap: '1.5rem',
        width: '100%'
      }}
    >
      {children}
    </div>
  );
};

export default CardGrid;

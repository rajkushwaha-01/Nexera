import React from 'react';

const Card = ({
  children,
  className = '',
  hover = false,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-line rounded-xl shadow-ambient transition-all duration-150 ${
        hover
          ? 'hover:border-line-strong hover:shadow-ambient-md cursor-pointer'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

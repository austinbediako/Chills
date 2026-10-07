import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary-900 dark:text-primary-100"
      >
        <rect width="40" height="40" rx="4" fill="currentColor" />
        <path
          d="M14 10V30M14 20H18L26 10H30L20 20L30 30H26L18 20"
          stroke="var(--color-light-100)"
          strokeWidth="3"
          strokeLinecap="square"
          strokeLinejoin="miter"
          className="stroke-light-100 dark:stroke-dark-100"
        />
      </svg>
      {showText && (
        <span className="text-xl font-heading font-bold tracking-tight text-primary-900 dark:text-primary-100">
          KBlog.
        </span>
      )}
    </div>
  );
};

export default Logo;

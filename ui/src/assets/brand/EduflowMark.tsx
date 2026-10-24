export const EduflowMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect
      x="5.5"
      y="4.5"
      width="17"
      height="23"
      rx="4"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M9.5 15.2c1.6-3.6 3.2 3.6 4.8 0s3.2 3.6 4.8 0 3.2 3.6 4.4 0"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M7.5 9.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
    <path
      d="M21.6 3.2 27 8.6l-7.7 7.7-4.8 1 1-4.8 6.1-9.3Z"
      fill="currentColor"
      opacity="0.85"
    />
    <path d="M20 17.5h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

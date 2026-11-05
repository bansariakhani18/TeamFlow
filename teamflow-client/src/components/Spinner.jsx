export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div
        className={`animate-spin rounded-full border-t-[#4E8765] border-stone-200 ${
          sizeClasses[size] || sizeClasses.md
        }`}
      />
    </div>
  );
};

export default Spinner;


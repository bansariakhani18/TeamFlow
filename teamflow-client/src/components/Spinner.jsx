import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Loader2
        className={`${
          sizeClasses[size] || sizeClasses.md
        } animate-spin text-[#4E8765]`}
      />
    </div>
  );
};

export default Spinner;

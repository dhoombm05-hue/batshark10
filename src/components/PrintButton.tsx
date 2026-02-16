import { Printer } from 'lucide-react';

interface PrintButtonProps {
  title?: string;
  className?: string;
}

export default function PrintButton({ title = 'طباعة', className = '' }: PrintButtonProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg transition-colors print:hidden ${className}`}
      title={title}
    >
      <Printer className="w-3.5 h-3.5" />
      <span>{title}</span>
    </button>
  );
}

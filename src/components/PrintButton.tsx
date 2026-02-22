import { Printer } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import logo from '@/assets/batshark-logo-new.png';

interface PrintButtonProps {
  title?: string;
  className?: string;
}

export default function PrintButton({ title = 'طباعة', className = '' }: PrintButtonProps) {
  const { profile } = useAuthContext();

  const handlePrint = () => {
    // Inject print header/footer dynamically
    const existing = document.querySelectorAll('.print-header-inject, .print-footer-inject');
    existing.forEach(el => el.remove());

    const main = document.querySelector('main');
    if (main) {
      const header = document.createElement('div');
      header.className = 'print-header-inject print-header';
      header.style.display = 'none';
      header.innerHTML = `
        <img src="${logo}" alt="BatShark" />
        <div style="text-align:left;font-size:10pt;color:#333;">
          <div><strong>BatShark Economy Intelligence</strong></div>
          <div>${profile?.display_name || 'مجهول'}</div>
          <div>${new Date().toLocaleDateString('ar-SA')} — ${new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      `;
      main.prepend(header);

      const footer = document.createElement('div');
      footer.className = 'print-footer-inject print-footer';
      footer.style.display = 'none';
      footer.innerHTML = `BatShark © ${new Date().getFullYear()} — تم الإنشاء بواسطة ${profile?.display_name || 'النظام'} — ${title}`;
      main.appendChild(footer);
    }

    window.print();

    // Clean up after print
    setTimeout(() => {
      document.querySelectorAll('.print-header-inject, .print-footer-inject').forEach(el => el.remove());
    }, 1000);
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

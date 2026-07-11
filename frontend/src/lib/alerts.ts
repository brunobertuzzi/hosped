import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const darkThemeConfig = {
  background: '#0a0a0a',
  color: '#ffffff',
  customClass: {
    popup: 'border border-white/10 rounded-2xl shadow-2xl',
    confirmButton: 'bg-brand text-black font-bold uppercase tracking-widest text-[11px] px-6 py-3 rounded-xl hover:brightness-110 transition-all outline-none',
    cancelButton: 'bg-white/5 text-white/50 hover:bg-white/10 font-bold uppercase tracking-widest text-[11px] px-6 py-3 rounded-xl transition-all border border-white/10 outline-none',
    input: 'bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand',
  },
  buttonsStyling: false,
};

export const alerts = {
  success: (title: string, text?: string) => {
    return MySwal.fire({ ...darkThemeConfig, icon: 'success', title, text, iconColor: '#34d399' });
  },
  error: (title: string, text?: string) => {
    return MySwal.fire({ ...darkThemeConfig, icon: 'error', title, text, iconColor: '#f87171' });
  },
  confirm: async (title: string, text?: string) => {
    const result = await MySwal.fire({
      ...darkThemeConfig,
      title,
      text,
      icon: 'warning',
      iconColor: '#fbbf24',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    });
    return result.isConfirmed;
  },
  prompt: async (title: string, defaultValue?: string, placeholder?: string) => {
    const result = await MySwal.fire({
      ...darkThemeConfig,
      title,
      input: 'text',
      inputValue: defaultValue || '',
      inputPlaceholder: placeholder || '',
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      cancelButtonText: 'Cancelar',
    });
    return result.isConfirmed ? result.value : null;
  }
};

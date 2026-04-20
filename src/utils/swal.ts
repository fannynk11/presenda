import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

/**
 * Standard colors for Presenda theme
 */
export const COLORS = {
  primary: '#1b5e20', // Green 900
  secondary: '#2e7d32', // Green 800
  accent: '#388e3c', // Green 700
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  success: '#10b981',
};

/**
 * Reusable SweetAlert Mixin for Center Dialogs
 */
export const SwalCenter = MySwal.mixin({
  confirmButtonColor: COLORS.primary,
  cancelButtonColor: '#6b7280',
  customClass: {
    confirmButton: 'swal-btn-primary',
    cancelButton: 'swal-btn-secondary',
  },
});

/**
 * Reusable SweetAlert Mixin for Toasts (Bottom-Right)
 */
export const SwalToast = MySwal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

export default MySwal;

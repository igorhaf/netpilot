import { toast as hotToast } from 'react-hot-toast';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const toast = ({ title, description, variant = 'default' }: ToastProps) => {
  const message = description ? `${title}: ${description}` : title;

  if (variant === 'destructive') {
    return hotToast.error(message);
  }

  return hotToast.success(message);
};

export { toast as useToast };
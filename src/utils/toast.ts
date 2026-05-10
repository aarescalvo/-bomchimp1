import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (msg: string) => sonnerToast.success(msg),
  error: (msg: string) => sonnerToast.error(msg),
  warning: (msg: string) => sonnerToast.warning(msg),
  info: (msg: string) => sonnerToast.info(msg),
  loading: (msg: string) => sonnerToast.loading(msg),
  promise: <T>(promise: Promise<T>, msgs: { loading: string; success: string; error: string }) => 
    sonnerToast.promise(promise, msgs)
};

// src/lib/notify.ts
import { toast } from 'sonner'

export const notify = {
  ok: (msg: string) => toast.success(msg),
  info: (msg: string) => toast(msg),
  warn: (msg: string) => toast.warning(msg),
  err: (msg: string) => toast.error(msg),
}

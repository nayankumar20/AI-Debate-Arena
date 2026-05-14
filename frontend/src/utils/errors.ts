import axios from 'axios';

export function formatApiError(err: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data as { message?: string } | undefined;
    if (msg?.message && typeof msg.message === 'string') return msg.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

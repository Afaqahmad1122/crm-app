export type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
  timestamp: string;
};

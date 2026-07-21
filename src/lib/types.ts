export type ActionResponse<T = unknown> = {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  count?: number;
};

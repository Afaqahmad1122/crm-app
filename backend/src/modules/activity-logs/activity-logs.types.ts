export interface ActivityLogPayload {
  action: string;
  customerId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface IActivityLogsService {
  log(dto: ActivityLogPayload): Promise<unknown>;
}

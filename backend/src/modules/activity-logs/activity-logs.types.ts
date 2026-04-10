export interface ActivityLogPayload {
  /** e.g. CUSTOMER, NOTE */
  entityType: string;
  /** Primary entity this event refers to */
  entityId: string;
  action: string;
  /** Customer this event is associated with (FK + org UI) */
  customerId: string;
  performedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface IActivityLogsService {
  log(dto: ActivityLogPayload): Promise<unknown>;
}

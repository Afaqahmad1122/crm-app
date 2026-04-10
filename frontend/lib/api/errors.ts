export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static fromResponse(status: number, payload: unknown): ApiError {
    if (payload && typeof payload === "object" && "message" in payload) {
      const raw = (payload as { message: unknown }).message;
      let text: string;
      if (typeof raw === "string") {
        text = raw;
      } else if (Array.isArray(raw)) {
        text = raw.map(String).join(", ");
      } else {
        text = JSON.stringify(raw);
      }
      return new ApiError(text || "Request failed", status, payload);
    }
    if (typeof payload === "string" && payload) {
      return new ApiError(payload, status, payload);
    }
    return new ApiError("Request failed", status, payload);
  }
}

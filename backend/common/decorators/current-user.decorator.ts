import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/** Set on `req.user` by JWT/auth guard (no password). */
export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  role: string;
}

type RequestWithUser = Request & { user?: AuthenticatedUser };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);

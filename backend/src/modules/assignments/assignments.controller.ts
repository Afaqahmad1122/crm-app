import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { AssignmentsService } from './assignments.service';
import { AssignCustomerDto } from './dto/assign-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  assign(@Body() dto: AssignCustomerDto, @CurrentUser() user: User) {
    return this.assignmentsService.assign(dto, user.organizationId, user.id);
  }

  @Delete()
  unassign(@Body() dto: AssignCustomerDto, @CurrentUser() user: User) {
    return this.assignmentsService.unassign(dto, user.organizationId, user.id);
  }

  @Get('user/:userId')
  getUserAssignments(
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    return this.assignmentsService.getUserAssignments(
      userId,
      user.organizationId,
    );
  }

  @Get('customer/:customerId')
  getCustomerAssignments(
    @Param('customerId') customerId: string,
    @CurrentUser() user: User,
  ) {
    return this.assignmentsService.getCustomerAssignments(
      customerId,
      user.organizationId,
    );
  }

  @Get('user/:userId/count')
  getUserCount(@Param('userId') userId: string, @CurrentUser() user: User) {
    return this.assignmentsService.getUserAssignmentCount(
      userId,
      user.organizationId,
    );
  }
}

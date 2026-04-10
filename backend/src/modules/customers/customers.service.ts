import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto } from './dto/pagination.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class CustomersService {
  constructor(
    private readonly repo: CustomersRepository,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async create(dto: CreateCustomerDto, organizationId: string, userId: string) {
    const customer = await this.repo.create(dto, organizationId);

    await this.activityLogs.log({
      action: 'CUSTOMER_CREATED',
      customerId: customer.id,
      userId,
      metadata: { name: customer.name },
    });

    return customer;
  }

  async findAll(organizationId: string, pagination: PaginationDto) {
    return this.repo.findAllPaginated(organizationId, pagination);
  }

  async findOne(id: string, organizationId: string) {
    const customer = await this.repo.findById(id, organizationId);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
    organizationId: string,
    userId: string,
  ) {
    const updated = await this.repo.update(id, dto, organizationId);
    if (!updated) throw new NotFoundException('Customer not found');

    await this.activityLogs.log({
      action: 'CUSTOMER_UPDATED',
      customerId: id,
      userId,
      metadata: { changes: dto },
    });

    return updated;
  }

  async remove(id: string, organizationId: string, userId: string) {
    const deleted = await this.repo.softDelete(id, organizationId);
    if (!deleted) throw new NotFoundException('Customer not found');

    await this.activityLogs.log({
      action: 'CUSTOMER_DELETED',
      customerId: id,
      userId,
    });

    return { message: 'Customer deleted successfully' };
  }

  async restore(id: string, organizationId: string, userId: string) {
    const restored = await this.repo.restore(id, organizationId);
    if (!restored) throw new NotFoundException('Deleted customer not found');

    await this.activityLogs.log({
      action: 'CUSTOMER_RESTORED',
      customerId: id,
      userId,
    });

    return restored;
  }

  async findDeleted(organizationId: string) {
    return this.repo.findDeleted(organizationId);
  }
}

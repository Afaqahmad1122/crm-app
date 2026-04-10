import { IsUUID } from 'class-validator';

export class AssignCustomerDto {
  @IsUUID()
  customerId: string;

  @IsUUID()
  userId: string;
}

import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Status } from '@prisma/client';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}

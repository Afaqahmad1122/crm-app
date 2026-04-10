import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(@Body() dto: CreateNoteDto, @CurrentUser() user: User) {
    return this.notesService.create(dto, user.id, user.organizationId);
  }

  @Get('customer/:customerId')
  findByCustomer(
    @Param('customerId') customerId: string,
    @CurrentUser() user: User,
  ) {
    return this.notesService.findByCustomer(customerId, user.organizationId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
    @CurrentUser() user: User,
  ) {
    return this.notesService.update(
      id,
      dto,
      user.id,
      user.role,
      user.organizationId,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notesService.remove(
      id,
      user.id,
      user.role,
      user.organizationId,
    );
  }
}

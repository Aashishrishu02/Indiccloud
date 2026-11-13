import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';

import { AdminAuthGuard } from '../admin-auth/admin-auth.guard.js';
import { AdminPlansService } from './admin-plans.service.js';
import { CreatePlanDto } from './dto/create-plan.dto.js';
import { UpdatePlanDto } from './dto/update-plan.dto.js';
import { UpdatePlanStatusDto } from './dto/update-plan-status.dto.js';

@Controller('admin/plans')
@UseGuards(AdminAuthGuard)
export class AdminPlansController {
  constructor(
    private readonly adminPlansService: AdminPlansService,
  ) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('productType') productType?: string,
    @Query('active') active?: string,
  ) {
    return this.adminPlansService.findAll(
      search,
      productType,
      active,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminPlansService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePlanDto) {
    return this.adminPlansService.create(dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanStatusDto,
  ) {
    return this.adminPlansService.updateStatus(id, dto.isActive);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.adminPlansService.update(id, dto);
  }
}

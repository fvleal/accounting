import { Module } from '@nestjs/common';
import { AccountApplicationModule } from '../application/account-application.module.js';
import { AccountController } from './controllers/account.controller.js';

@Module({
  imports: [AccountApplicationModule],
  controllers: [AccountController],
})
export class AccountInterfaceModule {}

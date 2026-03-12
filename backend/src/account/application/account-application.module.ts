import { Module } from '@nestjs/common';
import { AccountInfrastructureModule } from '../infrastructure/account-infrastructure.module';
// Commands
import { CreateAccountCommand } from './commands/create-account.command';
import { UpdateNameCommand } from './commands/update-name.command';
import { UpdatePhoneCommand } from './commands/update-phone.command';
import { UpdateBirthDateCommand } from './commands/update-birth-date.command';
import { UploadAccountPhotoCommand } from './commands/upload-account-photo.command';
// Queries
import { GetMeQuery } from './queries/get-me.query';

@Module({
  imports: [AccountInfrastructureModule],
  providers: [
    CreateAccountCommand,
    UpdateNameCommand,
    UpdatePhoneCommand,
    UpdateBirthDateCommand,
    UploadAccountPhotoCommand,
    GetMeQuery,
  ],
  exports: [
    CreateAccountCommand,
    UpdateNameCommand,
    UpdatePhoneCommand,
    UpdateBirthDateCommand,
    UploadAccountPhotoCommand,
    GetMeQuery,
  ],
})
export class AccountApplicationModule {}

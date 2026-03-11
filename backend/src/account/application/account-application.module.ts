import { Module } from '@nestjs/common';
import { AccountInfrastructureModule } from '../infrastructure/account-infrastructure.module';
// Commands
import { CreateAccountCommand } from './commands/create-account.command';
import { UpdateNameCommand } from './commands/update-name.command';
import { UpdatePhoneCommand } from './commands/update-phone.command';
import { UpdateBirthDateCommand } from './commands/update-birth-date.command';
import { UploadAccountPhotoCommand } from './commands/upload-account-photo.command';
// Queries
import { GetAccountByIdQuery } from './queries/get-account-by-id.query';
import { GetMeQuery } from './queries/get-me.query';
import { FindAccountByFieldQuery } from './queries/find-account-by-field.query';
import { ListAccountsQuery } from './queries/list-accounts.query';

@Module({
  imports: [AccountInfrastructureModule],
  providers: [
    CreateAccountCommand,
    UpdateNameCommand,
    UpdatePhoneCommand,
    UpdateBirthDateCommand,
    UploadAccountPhotoCommand,
    GetAccountByIdQuery,
    GetMeQuery,
    FindAccountByFieldQuery,
    ListAccountsQuery,
  ],
  exports: [
    CreateAccountCommand,
    UpdateNameCommand,
    UpdatePhoneCommand,
    UpdateBirthDateCommand,
    UploadAccountPhotoCommand,
    GetAccountByIdQuery,
    GetMeQuery,
    FindAccountByFieldQuery,
    ListAccountsQuery,
  ],
})
export class AccountApplicationModule {}

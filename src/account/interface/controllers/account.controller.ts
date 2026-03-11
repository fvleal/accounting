import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CurrentUser,
  Roles,
} from '../../../shared/infrastructure/auth/index.js';
import type { JwtPayload } from '../../../shared/infrastructure/auth/index.js';
import { CreateAccountDto } from '../dtos/create-account.dto.js';
import { UpdateAccountDto } from '../dtos/update-account.dto.js';
import { SendPhoneCodeDto } from '../dtos/send-phone-code.dto.js';
import { VerifyPhoneDto } from '../dtos/verify-phone.dto.js';
import { ListAccountsQueryDto } from '../dtos/list-accounts-query.dto.js';
import { AccountResponseDto } from '../dtos/account-response.dto.js';
import { CreateAccountCommand } from '../../application/commands/create-account.command.js';
import { UpdateNameCommand } from '../../application/commands/update-name.command.js';
import { UpdatePhoneCommand } from '../../application/commands/update-phone.command.js';
import { UpdateBirthDateCommand } from '../../application/commands/update-birth-date.command.js';
import { UploadAccountPhotoCommand } from '../../application/commands/upload-account-photo.command.js';
import { GetAccountByIdQuery } from '../../application/queries/get-account-by-id.query.js';
import { GetMeQuery } from '../../application/queries/get-me.query.js';
import { FindAccountByFieldQuery } from '../../application/queries/find-account-by-field.query.js';
import { ListAccountsQuery } from '../../application/queries/list-accounts.query.js';

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly createAccount: CreateAccountCommand,
    private readonly updateName: UpdateNameCommand,
    private readonly updatePhone: UpdatePhoneCommand,
    private readonly updateBirthDate: UpdateBirthDateCommand,
    private readonly uploadPhoto: UploadAccountPhotoCommand,
    private readonly getById: GetAccountByIdQuery,
    private readonly getMe: GetMeQuery,
    private readonly findByField: FindAccountByFieldQuery,
    private readonly listAccounts: ListAccountsQuery,
  ) {}

  @Post()
  @HttpCode(201)
  @Roles('create:account')
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    const output = await this.createAccount.execute({
      auth0Sub: user.sub,
      email: user.email,
      name: dto.name,
      cpf: dto.cpf,
    });
    return AccountResponseDto.fromOutput(output);
  }

  @Get('me')
  @Roles('read:own-account')
  async me(@CurrentUser() user: JwtPayload): Promise<AccountResponseDto> {
    const output = await this.getMe.execute({ auth0Sub: user.sub });
    return AccountResponseDto.fromOutput(output);
  }

  @Get(':id')
  @Roles('read:accounts')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AccountResponseDto> {
    const output = await this.getById.execute({ id });
    return AccountResponseDto.fromOutput(output);
  }

  @Get()
  @Roles('read:accounts')
  async list(@Query() query: ListAccountsQueryDto) {
    if (query.cpf) {
      const output = await this.findByField.execute({
        field: 'cpf',
        value: query.cpf,
      });
      return AccountResponseDto.fromOutput(output);
    }

    const output = await this.listAccounts.execute({
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    });

    return {
      data: output.data.map(AccountResponseDto.fromOutput),
      total: output.total,
      offset: query.offset ?? 0,
      limit: query.limit ?? 20,
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    if (!dto.name && !dto.birthDate) {
      throw new BadRequestException('At least one field must be provided');
    }

    let lastOutput:
      | {
          id: string;
          name: string;
          email: string;
          cpf: string;
          birthDate: Date | null;
          phone: string | null;
          photoUrl: string | null;
          createdAt: Date;
          updatedAt: Date;
        }
      | undefined;

    if (dto.name) {
      lastOutput = await this.updateName.execute({
        accountId: id,
        auth0Sub: user.sub,
        name: dto.name,
      });
    }

    if (dto.birthDate) {
      lastOutput = await this.updateBirthDate.execute({
        accountId: id,
        auth0Sub: user.sub,
        birthDate: new Date(dto.birthDate),
      });
    }

    return AccountResponseDto.fromOutput(lastOutput!);
  }

  @Post(':id/phone/send-code')
  async sendPhoneCode(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendPhoneCodeDto,
  ): Promise<AccountResponseDto> {
    const output = await this.updatePhone.execute({
      accountId: id,
      auth0Sub: user.sub,
      phone: dto.phone,
    });
    return AccountResponseDto.fromOutput(output);
  }

  @Post(':id/phone/verify')
  verifyPhone(
    @Param('id', ParseUUIDPipe) _id: string,
    @Body() _dto: VerifyPhoneDto,
  ): never {
    throw new HttpException(
      'Phone verification not yet implemented',
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAccountPhoto(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<AccountResponseDto> {
    const output = await this.uploadPhoto.execute({
      accountId: id,
      auth0Sub: user.sub,
      buffer: file.buffer,
      contentType: file.mimetype,
    });
    return AccountResponseDto.fromOutput(output);
  }
}

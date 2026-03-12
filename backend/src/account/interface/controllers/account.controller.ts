import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../../shared/infrastructure/auth/index.js';
import type { JwtPayload } from '../../../shared/infrastructure/auth/index.js';
import { CreateAccountDto } from '../dtos/create-account.dto.js';
import { UpdateAccountDto } from '../dtos/update-account.dto.js';
import { SendPhoneCodeDto } from '../dtos/send-phone-code.dto.js';
import { VerifyPhoneDto } from '../dtos/verify-phone.dto.js';
import { AccountResponseDto } from '../dtos/account-response.dto.js';
import { CreateAccountCommand } from '../../application/commands/create-account.command.js';
import { UpdateNameCommand } from '../../application/commands/update-name.command.js';
import { UpdatePhoneCommand } from '../../application/commands/update-phone.command.js';
import { UpdateBirthDateCommand } from '../../application/commands/update-birth-date.command.js';
import { UploadAccountPhotoCommand } from '../../application/commands/upload-account-photo.command.js';
import { GetMeQuery } from '../../application/queries/get-me.query.js';

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly createAccount: CreateAccountCommand,
    private readonly updateName: UpdateNameCommand,
    private readonly updatePhone: UpdatePhoneCommand,
    private readonly updateBirthDate: UpdateBirthDateCommand,
    private readonly uploadPhoto: UploadAccountPhotoCommand,
    private readonly getMe: GetMeQuery,
  ) {}

  @Post()
  @HttpCode(201)
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    const output = await this.createAccount.execute({
      email: user.email,
      name: dto.name,
      cpf: dto.cpf,
    });
    return AccountResponseDto.fromOutput(output);
  }

  @Get('me')
  async me(@CurrentUser() user: JwtPayload): Promise<AccountResponseDto> {
    const output = await this.getMe.execute({ email: user.email });
    return AccountResponseDto.fromOutput(output);
  }

  @Patch('me')
  async update(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    if (!dto.name && !dto.birthDate) {
      throw new BadRequestException('At least one field must be provided');
    }

    const me = await this.getMe.execute({ email: user.email });

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
        accountId: me.id,
        name: dto.name,
      });
    }

    if (dto.birthDate) {
      lastOutput = await this.updateBirthDate.execute({
        accountId: me.id,
        birthDate: new Date(dto.birthDate),
      });
    }

    return AccountResponseDto.fromOutput(lastOutput!);
  }

  @Post('me/phone/send-code')
  @HttpCode(200)
  async sendPhoneCode(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendPhoneCodeDto,
  ): Promise<AccountResponseDto> {
    const me = await this.getMe.execute({ email: user.email });
    const output = await this.updatePhone.execute({
      accountId: me.id,
      phone: dto.phone,
    });
    return AccountResponseDto.fromOutput(output);
  }

  @Post('me/phone/verify')
  verifyPhone(@Body() _dto: VerifyPhoneDto): never {
    throw new HttpException(
      'Phone verification not yet implemented',
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @Post('me/photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAccountPhoto(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<AccountResponseDto> {
    const me = await this.getMe.execute({ email: user.email });
    const output = await this.uploadPhoto.execute({
      accountId: me.id,
      buffer: file.buffer,
      contentType: file.mimetype,
    });
    return AccountResponseDto.fromOutput(output);
  }
}

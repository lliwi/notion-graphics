import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  create(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<Omit<User, 'password_hash'>[]> {
    const users = await this.usersRepository.find({
      order: { created_at: 'DESC' },
    });
    return users.map(({ password_hash: _, ...rest }) => rest as Omit<User, 'password_hash'>);
  }

  async getProfile(userId: string): Promise<Omit<User, 'password_hash'>> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const { password_hash: _, ...rest } = user;
    return rest as Omit<User, 'password_hash'>;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Omit<User, 'password_hash'>> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.email && dto.email !== user.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing) throw new BadRequestException('Este email ya está en uso');
      user.email = dto.email;
    }

    if (dto.name !== undefined) user.name = dto.name;

    const saved = await this.usersRepository.save(user);
    const { password_hash: _, ...rest } = saved;
    return rest as Omit<User, 'password_hash'>;
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const valid = await bcrypt.compare(dto.current_password, user.password_hash);
    if (!valid) throw new UnauthorizedException('La contraseña actual es incorrecta');

    user.password_hash = await bcrypt.hash(dto.new_password, 12);
    await this.usersRepository.save(user);
  }

  async deleteOwn(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.usersRepository.remove(user);
  }

  async adminDelete(requesterId: string, targetId: string): Promise<void> {
    if (requesterId === targetId) {
      throw new ForbiddenException('No puedes eliminar tu propia cuenta desde el panel de admin');
    }
    const user = await this.findById(targetId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.usersRepository.remove(user);
  }

  async adminUpdate(
    requesterId: string,
    targetId: string,
    dto: AdminUpdateUserDto,
  ): Promise<Omit<User, 'password_hash'>> {
    if (requesterId === targetId) {
      throw new ForbiddenException('No puedes modificar tu propio rol o estado');
    }
    const user = await this.findById(targetId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.role !== undefined) user.role = dto.role;
    if (dto.status !== undefined) user.status = dto.status;

    const saved = await this.usersRepository.save(user);
    const { password_hash: _, ...rest } = saved;
    return rest as Omit<User, 'password_hash'>;
  }
}

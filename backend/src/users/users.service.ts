import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserType } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByOpenid(openid: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { openid } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, userData);
    return this.findOne(id);
  }

  async updateProfile(userId: number, profileData: Partial<User>): Promise<User> {
    return this.update(userId, profileData);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findByType(userType: UserType): Promise<User[]> {
    return this.userRepository.find({ where: { userType } });
  }

  async deactivateUser(id: number): Promise<void> {
    await this.userRepository.update(id, { isActive: false });
  }

  async activateUser(id: number): Promise<void> {
    await this.userRepository.update(id, { isActive: true });
  }
}
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const user = await service.create('test@example.com', 'Password123!', 'Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.passwordHash).not.toBe('Password123!');
      expect(user.id).toBeDefined();
    });

    it('should normalize email to lowercase', async () => {
      const user = await service.create('TEST@EXAMPLE.COM', 'Password123!', 'Test');
      expect(user.email).toBe('test@example.com');
    });

    it('should throw ConflictException for duplicate email', async () => {
      await service.create('dup@example.com', 'Password123!', 'User 1');
      await expect(service.create('dup@example.com', 'OtherPass!', 'User 2')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      await service.create('find@example.com', 'Password123!', 'Find User');
      const found = await service.findByEmail('find@example.com');
      expect(found).toBeDefined();
      expect(found!.email).toBe('find@example.com');
    });

    it('should return undefined for unknown email', async () => {
      const result = await service.findByEmail('unknown@example.com');
      expect(result).toBeUndefined();
    });
  });

  describe('validatePassword', () => {
    it('should return true for correct password', async () => {
      const user = await service.create('valid@example.com', 'Password123!', 'Valid');
      const result = await service.validatePassword(user, 'Password123!');
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const user = await service.create('wrong@example.com', 'Password123!', 'Wrong');
      const result = await service.validatePassword(user, 'WrongPassword');
      expect(result).toBe(false);
    });
  });
});

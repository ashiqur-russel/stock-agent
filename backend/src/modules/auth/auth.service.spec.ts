import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, UsersService, { provide: JwtService, useValue: mockJwtService }],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a user and return access token', async () => {
      const result = await service.register({
        name: 'Test User',
        email: 'register@example.com',
        password: 'Password123!',
      });
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('register@example.com');
    });
  });

  describe('login', () => {
    it('should login a registered user', async () => {
      await service.register({
        name: 'Login User',
        email: 'login@example.com',
        password: 'Password123!',
      });

      const result = await service.login({
        email: 'login@example.com',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('login@example.com');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      await expect(service.login({ email: 'nouser@example.com', password: 'any' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      await service.register({
        name: 'WP User',
        email: 'wp@example.com',
        password: 'Password123!',
      });
      await expect(
        service.login({ email: 'wp@example.com', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

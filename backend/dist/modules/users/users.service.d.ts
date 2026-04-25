import { User } from './entities/user.entity';
export declare class UsersService {
    private readonly users;
    create(email: string, password: string, name: string): Promise<User>;
    findByEmail(email: string): Promise<User | undefined>;
    findById(id: string): Promise<User | undefined>;
    validatePassword(user: User, password: string): Promise<boolean>;
}

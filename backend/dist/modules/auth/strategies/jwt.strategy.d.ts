import { Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
interface JwtPayload {
    sub: string;
    email: string;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly usersService;
    constructor(usersService: UsersService);
    validate(payload: JwtPayload): Promise<{
        id: string;
        email: string;
        name: string;
    }>;
}
export {};

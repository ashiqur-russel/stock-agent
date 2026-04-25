"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const uuid_1 = require("uuid");
let UsersService = class UsersService {
    constructor() {
        this.users = new Map();
    }
    async create(email, password, name) {
        const existing = await this.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException('Email already in use');
        }
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const user = {
            id: (0, uuid_1.v4)(),
            email: email.toLowerCase().trim(),
            passwordHash,
            name: name.trim(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.users.set(user.id, user);
        return user;
    }
    async findByEmail(email) {
        const normalizedEmail = email.toLowerCase().trim();
        for (const user of this.users.values()) {
            if (user.email === normalizedEmail) {
                return user;
            }
        }
        return undefined;
    }
    async findById(id) {
        return this.users.get(id);
    }
    async validatePassword(user, password) {
        return bcrypt.compare(password, user.passwordHash);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map
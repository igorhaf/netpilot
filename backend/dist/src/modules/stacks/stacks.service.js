"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StacksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stack_entity_1 = require("../../entities/stack.entity");
let StacksService = class StacksService {
    constructor(stacksRepository) {
        this.stacksRepository = stacksRepository;
    }
    async create(createStackDto) {
        const stack = this.stacksRepository.create(createStackDto);
        return await this.stacksRepository.save(stack);
    }
    async findAll(search, technology) {
        const query = this.stacksRepository.createQueryBuilder('stack');
        if (search) {
            query.andWhere('(stack.name ILIKE :search OR stack.description ILIKE :search OR stack.tags::text ILIKE :search)', { search: `%${search}%` });
        }
        if (technology) {
            query.andWhere('stack.technology = :technology', { technology });
        }
        return await query.orderBy('stack.createdAt', 'DESC').getMany();
    }
    async findOne(id) {
        const stack = await this.stacksRepository.findOne({ where: { id } });
        if (!stack) {
            throw new common_1.NotFoundException('Stack não encontrada');
        }
        return stack;
    }
    async getTechnologies() {
        const stacks = await this.stacksRepository.find();
        const technologies = [...new Set(stacks.map(s => s.technology))];
        return technologies.sort();
    }
    async remove(id) {
        const result = await this.stacksRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException('Stack não encontrada');
        }
    }
};
exports.StacksService = StacksService;
exports.StacksService = StacksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stack_entity_1.Stack)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StacksService);
//# sourceMappingURL=stacks.service.js.map
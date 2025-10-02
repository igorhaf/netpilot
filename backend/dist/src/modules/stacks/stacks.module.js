"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StacksModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const stacks_controller_1 = require("./stacks.controller");
const stacks_service_1 = require("./stacks.service");
const stack_entity_1 = require("../../entities/stack.entity");
let StacksModule = class StacksModule {
};
exports.StacksModule = StacksModule;
exports.StacksModule = StacksModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([stack_entity_1.Stack])],
        controllers: [stacks_controller_1.StacksController],
        providers: [stacks_service_1.StacksService],
        exports: [stacks_service_1.StacksService],
    })
], StacksModule);
//# sourceMappingURL=stacks.module.js.map
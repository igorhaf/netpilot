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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerSimpleModule = void 0;
const common_1 = require("@nestjs/common");
const test_controller_1 = require("./controllers/test.controller");
let DockerSimpleModule = class DockerSimpleModule {
    constructor() {
        console.log('🐳 DockerSimpleModule loaded successfully');
    }
};
exports.DockerSimpleModule = DockerSimpleModule;
exports.DockerSimpleModule = DockerSimpleModule = __decorate([
    (0, common_1.Module)({
        controllers: [test_controller_1.TestController],
        providers: [],
    }),
    __metadata("design:paramtypes", [])
], DockerSimpleModule);
//# sourceMappingURL=docker-simple.module.js.map
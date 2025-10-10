"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveIsActiveFromPresets1759854400073 = void 0;
class RemoveIsActiveFromPresets1759854400073 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "presets" DROP COLUMN "isActive"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "presets" ADD "isActive" boolean NOT NULL DEFAULT true`);
    }
}
exports.RemoveIsActiveFromPresets1759854400073 = RemoveIsActiveFromPresets1759854400073;
//# sourceMappingURL=1759854400073-RemoveIsActiveFromPresets.js.map
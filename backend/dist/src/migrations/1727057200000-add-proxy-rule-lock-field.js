"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddProxyRuleLockField1727057200000 = void 0;
const typeorm_1 = require("typeorm");
class AddProxyRuleLockField1727057200000 {
    async up(queryRunner) {
        await queryRunner.addColumn('proxy_rules', new typeorm_1.TableColumn({
            name: 'isLocked',
            type: 'boolean',
            default: false,
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('proxy_rules', 'isLocked');
    }
}
exports.AddProxyRuleLockField1727057200000 = AddProxyRuleLockField1727057200000;
//# sourceMappingURL=1727057200000-add-proxy-rule-lock-field.js.map
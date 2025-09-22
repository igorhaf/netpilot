"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateJobQueueDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_job_queue_dto_1 = require("./create-job-queue.dto");
class UpdateJobQueueDto extends (0, mapped_types_1.PartialType)(create_job_queue_dto_1.CreateJobQueueDto) {
}
exports.UpdateJobQueueDto = UpdateJobQueueDto;
//# sourceMappingURL=update-job-queue.dto.js.map
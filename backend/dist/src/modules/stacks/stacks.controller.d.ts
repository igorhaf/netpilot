import { StacksService } from './stacks.service';
import { CreateStackDto } from './dto/create-stack.dto';
export declare class StacksController {
    private readonly stacksService;
    constructor(stacksService: StacksService);
    create(createStackDto: CreateStackDto): Promise<import("../../entities/stack.entity").Stack>;
    findAll(search?: string, technology?: string): Promise<import("../../entities/stack.entity").Stack[]>;
    getTechnologies(): Promise<string[]>;
    findOne(id: string): Promise<import("../../entities/stack.entity").Stack>;
    remove(id: string): Promise<void>;
}

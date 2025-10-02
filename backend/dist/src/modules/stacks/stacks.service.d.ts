import { Repository } from 'typeorm';
import { Stack } from '../../entities/stack.entity';
import { CreateStackDto } from './dto/create-stack.dto';
export declare class StacksService {
    private stacksRepository;
    constructor(stacksRepository: Repository<Stack>);
    create(createStackDto: CreateStackDto): Promise<Stack>;
    findAll(search?: string, technology?: string): Promise<Stack[]>;
    findOne(id: string): Promise<Stack>;
    getTechnologies(): Promise<string[]>;
    remove(id: string): Promise<void>;
}

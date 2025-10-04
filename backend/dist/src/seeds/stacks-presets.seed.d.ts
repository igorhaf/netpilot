import { DataSource } from 'typeorm';
export declare class StacksPresetsSeed {
    run(dataSource: DataSource): Promise<void>;
    private createLaravelStack;
    private createNextStack;
    private createReactNativeStack;
    private createSharedPresets;
}
export default StacksPresetsSeed;

export declare class CreateVolumeDto {
    name: string;
    driver?: string;
    driver_opts?: Record<string, string>;
    labels?: Record<string, string>;
}

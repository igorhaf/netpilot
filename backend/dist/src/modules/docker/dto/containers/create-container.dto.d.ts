declare class VolumeMount {
    source: string;
    target: string;
    type: 'bind' | 'volume';
    readonly?: boolean;
}
declare class PortBinding {
    HostPort: string;
}
export declare class CreateContainerDto {
    name: string;
    image: string;
    env?: string[];
    ports?: Record<string, PortBinding[]>;
    volumes?: VolumeMount[];
    networks?: string[];
    restart_policy?: 'no' | 'always' | 'unless-stopped' | 'on-failure';
    labels?: Record<string, string>;
    command?: string[];
}
export {};

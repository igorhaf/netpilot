import { Request, Response } from 'express';
export declare class DockerProxyController {
    private readonly pythonServiceUrl;
    proxyRequest(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}

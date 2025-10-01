import { All, Controller, Req, Res, Param } from '@nestjs/common';
import { Request, Response } from 'express';
import axios from 'axios';

@Controller('docker')
export class DockerProxyController {
  private readonly pythonServiceUrl = process.env.SYSTEM_OPS_URL || process.env.PYTHON_SERVICE_URL || 'http://host.docker.internal:8001';

  @All('*')
  async proxyRequest(@Req() req: Request, @Res() res: Response) {
    try {
      // Get the path after /api/docker
      const originalUrl = req.originalUrl || req.url;
      const match = originalUrl.match(/\/api\/docker(\/.*)$/);
      const path = match ? match[1] : '';

      const method = req.method.toLowerCase();
      const url = `${this.pythonServiceUrl}/docker${path}`;

      console.log(`[Docker Proxy] ${method.toUpperCase()} ${url}`);

      const response = await axios({
        method: method as any,
        url: url,
        data: req.body,
        params: req.query,
        headers: {
          ...req.headers,
          host: undefined, // Remove host header
        },
        validateStatus: () => true, // Accept any status code
      });

      // Forward all headers except some that shouldn't be forwarded
      const headersToRemove = ['content-encoding', 'transfer-encoding', 'connection'];
      Object.keys(response.headers).forEach(key => {
        if (!headersToRemove.includes(key.toLowerCase())) {
          res.setHeader(key, response.headers[key]);
        }
      });

      return res.status(response.status).send(response.data);
    } catch (error) {
      console.error('[Docker Proxy] Error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Proxy error: ' + error.message,
      });
    }
  }
}
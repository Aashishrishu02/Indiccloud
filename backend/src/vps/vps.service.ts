
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface DemoVps {
  ip: string;
  status: 'RUNNING' | 'STOPPED';
  os: string;
  ram: number;
  expiresAt: string;
}

@Injectable()
export class VpsService {
  private readonly mode: string;
  private readonly baseUrl?: string;
  private readonly authorization?: string;

  private readonly demoVps = new Map<string, DemoVps>([
    [
      '203.0.113.10',
      {
        ip: '203.0.113.10',
        status: 'RUNNING',
        os: 'Ubuntu 22.04',
        ram: 4,
        expiresAt: '2027-12-31',
      },
    ],
    [
      '203.0.113.11',
      {
        ip: '203.0.113.11',
        status: 'STOPPED',
        os: 'Windows Server 2022',
        ram: 8,
        expiresAt: '2027-12-31',
      },
    ],
  ]);

  constructor(private readonly configService: ConfigService) {
    this.mode = (
      this.configService.get<string>('VPS_MODE') || 'DEMO'
    ).toUpperCase();

    const baseUrl = this.configService.get<string>('SMARTVPS_BASE_URL');
    const username = this.configService.get<string>('SMARTVPS_USERNAME');
    const password = this.configService.get<string>('SMARTVPS_PASSWORD');

    if (this.mode === 'REAL') {
      if (!baseUrl || !username || !password) {
        throw new Error(
          'SmartVPS credentials are required in REAL mode',
        );
      }

      this.baseUrl = baseUrl.replace(/\/+$/, '');
      this.authorization =
        'Basic ' +
        Buffer.from(`${username}:${password}`).toString('base64');
    }

    console.log(`VPS Service running in ${this.mode} mode`);
  }

  private async request(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: Record<string, string | number>,
  ): Promise<unknown> {
    if (this.mode !== 'REAL' || !this.baseUrl || !this.authorization) {
      throw new ServiceUnavailableException(
        'Real VPS provider API is not configured',
      );
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/oceansmart/${endpoint}`,
        {
          method,
          headers: {
            Authorization: this.authorization,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
          signal: AbortSignal.timeout(20000),
        },
      );

      const responseText = await response.text();

      if (!response.ok) {
        throw new ServiceUnavailableException(
          `SmartVPS provider returned HTTP ${response.status}`,
        );
      }

      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Unable to communicate with VPS provider',
      );
    }
  }

  async getIpStock() {
    if (this.mode === 'DEMO') {
      return {
        demo: true,
        availableIps: [
          '203.0.113.12',
          '203.0.113.13',
          '203.0.113.14',
        ],
      };
    }

    return this.request('ipstock', 'GET');
  }

  async getStatus(ip: string) {
    if (this.mode === 'DEMO') {
      const vps = this.demoVps.get(ip);

      if (!vps) {
        throw new BadRequestException('Demo VPS not found');
      }

      return { demo: true, ...vps };
    }

    return this.request('status', 'POST', { ip });
  }

  async start(ip: string) {
    if (this.mode === 'DEMO') {
      const vps = this.demoVps.get(ip);

      if (!vps) {
        throw new BadRequestException('Demo VPS not found');
      }

      vps.status = 'RUNNING';

      return {
        demo: true,
        message: 'Demo VPS started successfully',
        ip,
        status: vps.status,
      };
    }

    return this.request('start', 'POST', { ip });
  }

  async stop(ip: string) {
    if (this.mode === 'DEMO') {
      const vps = this.demoVps.get(ip);

      if (!vps) {
        throw new BadRequestException('Demo VPS not found');
      }

      vps.status = 'STOPPED';

      return {
        demo: true,
        message: 'Demo VPS stopped successfully',
        ip,
        status: vps.status,
      };
    }

    return this.request('stop', 'POST', { ip });
  }

  async buy(ip: string, ram: number) {
    if (this.mode === 'DEMO') {
      if (this.demoVps.has(ip)) {
        throw new BadRequestException('Demo VPS already exists');
      }

      const vps: DemoVps = {
        ip,
        status: 'RUNNING',
        os: 'Ubuntu 22.04',
        ram,
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString().slice(0, 10),
      };

      this.demoVps.set(ip, vps);

      return {
        demo: true,
        message: 'Demo VPS purchased successfully',
        ...vps,
      };
    }

    return this.request('buyvps', 'POST', { ip, ram });
  }

  async renew(ip: string) {
    if (this.mode === 'DEMO') {
      const vps = this.demoVps.get(ip);

      if (!vps) {
        throw new BadRequestException('Demo VPS not found');
      }

      const currentExpiry = new Date(vps.expiresAt);
      const baseDate =
        currentExpiry.getTime() > Date.now()
          ? currentExpiry
          : new Date();

      baseDate.setDate(baseDate.getDate() + 30);
      vps.expiresAt = baseDate.toISOString().slice(0, 10);

      return {
        demo: true,
        message: 'Demo VPS renewed for 30 days',
        ip,
        expiresAt: vps.expiresAt,
      };
    }

    return this.request('renewvps', 'POST', { ip });
  }

  async changeOs(ip: string, os: string) {
    const allowedOs = [
      '2012',
      '2016',
      '2019',
      '2022',
      '11',
      'centos',
      'ubuntu',
    ];

    if (!allowedOs.includes(os.toLowerCase())) {
      throw new BadRequestException('Unsupported operating system');
    }

    if (this.mode === 'DEMO') {
      const vps = this.demoVps.get(ip);

      if (!vps) {
        throw new BadRequestException('Demo VPS not found');
      }

      vps.os = os;

      return {
        demo: true,
        message: 'Demo operating system changed successfully',
        ip,
        operatingSystem: vps.os,
      };
    }

    return this.request('changeos', 'POST', { ip, os });
  }

  async getOsTemplate(ip: string) {
    if (this.mode === 'DEMO') {
      if (!this.demoVps.has(ip)) {
        throw new BadRequestException('Demo VPS not found');
      }

      return {
        demo: true,
        templates: [
          'Windows Server 2012',
          'Windows Server 2016',
          'Windows Server 2019',
          'Windows Server 2022',
          'Windows 11',
          'Ubuntu',
          'CentOS',
        ],
      };
    }

    return this.request('getostemplate', 'POST', { ip });
  }
}

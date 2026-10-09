import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BotApiService } from '../bot-api/bot-api.service.js';
import {
  BusinessStabilityResult,
  CompanyDetails,
  CompanyLicenseDetails,
} from './interfaces/business-analysis.interface.js';

// Service สำหรับจัดการการวิเคราะห์ธุรกิจ
@Injectable()
export class BusinessAnalysisService {
  constructor(private readonly botApiService: BotApiService) {}

  async analyzeBusiness(businessName: string) {
    // กัน type-confusion / ค่าว่าง ไม่ให้ .trim() โยน TypeError -> 500
    if (typeof businessName !== 'string' || businessName.trim().length === 0) {
      throw new BadRequestException('business_name is required.');
    }

    const formattedName = businessName.trim();

    const results = await this.botApiService.searchAuthorizedCompany(formattedName);
    if (!results || results.length === 0) {
      throw new NotFoundException('Company not found.');
    }

    const company: CompanyDetails = {
      Id: results[0].Id,
      AuthorizedName: results[0].AuthorizedName,
    };

    const detail = await this.botApiService.getCompanyLicenseDetails(company.Id);
    const details = detail as unknown as CompanyLicenseDetails;

    const analysis = this.analyzeStability(company, details);

    return {
      success: true,
      data: analysis,
    };
  }

  private analyzeStability(
    company: CompanyDetails,
    detail: CompanyLicenseDetails,
  ): BusinessStabilityResult {
    // กัน BOT ส่ง LicenseInformations ที่ไม่ใช่ array หรือมี item เป็น null
    const rawLicenses = Array.isArray(detail.LicenseInformations)
      ? detail.LicenseInformations
      : [];
    const licenses = rawLicenses.filter(
      (license) => license && typeof license === 'object',
    );
    const activeLicenses = licenses.filter((license) => license.StatusCode === '1');
    const inactiveLicenses = licenses.filter((license) => license.StatusCode !== '1');
    const authorization = detail.AuthorizationInfo ?? {};

    let score = 0;
    score += Math.min(activeLicenses.length * 15, 45);

    if (authorization.DepositFlag === 'T') score += 20;
    if (authorization.LoanFlag === 'T') score += 20;
    if (authorization.HPLSFlag === 'T') score += 15;

    score = Math.min(score, 100);

    let level: 'HIGH' | 'MEDIUM' | 'LOW';
    if (score >= 70) level = 'HIGH';
    else if (score >= 40) level = 'MEDIUM';
    else level = 'LOW';

    return {
      company: {
        id: company.Id,
        name: authorization.AuthorizedName ?? company.AuthorizedName,
        type: authorization.TypeName ?? '',
        address: authorization.Address ?? '',
      },
      licenseSummary: {
        total: licenses.length,
        active: activeLicenses.length,
        inactive: inactiveLicenses.length,
        licenses,
      },
      serviceCapabilities: {
        deposit: authorization.DepositFlag === 'T',
        loan: authorization.LoanFlag === 'T',
        hpls: authorization.HPLSFlag === 'T',
      },
      stability: { score, level },
    };
  }
}

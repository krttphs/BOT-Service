import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from '@jest/globals';
import { BusinessAnalysisService } from './business-analysis.service.js';

describe('BusinessAnalysisService', () => {
  let service: BusinessAnalysisService;
   
  let mockBotApiService: any;

  beforeEach(() => {
    // สร้าง Service โดยส่ง Mock BotApiService เข้าไป
    // เพราะ BusinessAnalysisService ใช้ BotApiService ในการเรียกข้อมูลจาก BOT API
    mockBotApiService = {
      searchAuthorizedCompany: jest.fn(),
      getCompanyLicenseDetails: jest.fn(),
    };
    service = new BusinessAnalysisService(mockBotApiService);
  });

  // Test การวิเคราะห์ธุรกิจ
  describe('analyzeBusiness', () => {

    // ตรวจสอบกรณีที่ค้นหาบริษัทไม่พบ
    it('should throw NotFoundException when company is not found', async () => {

      // จำลอง BotApiService ให้ค้นหาบริษัทไม่พบ
      mockBotApiService.searchAuthorizedCompany.mockResolvedValue([]);

      await expect(
        service.analyzeBusiness('Company XYZ'),
      ).rejects.toThrow('Company not found.');
    });

    // ตรวจสอบว่า Service ตัดช่องว่างก่อนค้นหา
    it('should trim business name before searching', async () => {

      mockBotApiService.searchAuthorizedCompany.mockResolvedValue([
        { Id: '1', AuthorizedName: 'Bank A' },
      ]);
      mockBotApiService.getCompanyLicenseDetails.mockResolvedValue({
        AuthorizationInfo: {},
        LicenseInformations: [],
        Branches: null,
      });

      await service.analyzeBusiness('  Bank A  ');

      // ตรวจสอบว่า Service เรียก BOT API ด้วยชื่อที่ตัดช่องว่างแล้ว
      expect(mockBotApiService.searchAuthorizedCompany).toHaveBeenCalledWith(
        'Bank A',
      );
    });

    // ตรวจสอบกรณีที่บริษัทมีใบอนุญาตและความสามารถครบถ้วน
    it('should return HIGH stability when company has many licenses', async () => {

      // สร้างข้อมูลใบอนุญาตชุดหนึ่ง
      const makeLicense = (status: string) => ({
        PermitDate: '',
        StartDate: '',
        EndDate: '',
        Id: '',
        Code: '',
        Name: '',
        StatusCode: status,
        StatusName: '',
        LcnNo: '',
      });

      mockBotApiService.searchAuthorizedCompany.mockResolvedValue([
        { Id: '123', AuthorizedName: 'Bank A' },
      ]);
      mockBotApiService.getCompanyLicenseDetails.mockResolvedValue({
        AuthorizationInfo: {
          AuthorizedName: 'Bank A (Full)',
          TypeName: 'Commercial Bank',
          Address: 'Bangkok',
          DepositFlag: 'T',
          LoanFlag: 'T',
          HPLSFlag: 'T',
        },
        LicenseInformations: [
          makeLicense('1'),
          makeLicense('1'),
          makeLicense('1'),
          makeLicense('0'),
        ],
        Branches: null,
      });

      const result = await service.analyzeBusiness('Bank A');

      // ตรวจสอบข้อมูลบริษัท
      expect(result.success).toBe(true);
      expect(result.data.company.id).toBe('123');
      expect(result.data.company.name).toBe('Bank A (Full)');
      expect(result.data.company.type).toBe('Commercial Bank');
      expect(result.data.company.address).toBe('Bangkok');

      // ตรวจสอบสรุปใบอนุญาต
      expect(result.data.licenseSummary.total).toBe(4);
      expect(result.data.licenseSummary.active).toBe(3);
      expect(result.data.licenseSummary.inactive).toBe(1);

      // ตรวจสอบความสามารถของบริษัท
      expect(result.data.serviceCapabilities.deposit).toBe(true);
      expect(result.data.serviceCapabilities.loan).toBe(true);
      expect(result.data.serviceCapabilities.hpls).toBe(true);

      // ตรวจสอบระดับความมั่นคง
      expect(result.data.stability.score).toBe(100);
      expect(result.data.stability.level).toBe('HIGH');

      // ตรวจสอบว่า Service เรียก BOT API ด้วย id ที่ถูกต้อง
      expect(mockBotApiService.getCompanyLicenseDetails).toHaveBeenCalledWith(
        '123',
      );
    });

    // ตรวจสอบกรณีที่บริษัทมีใบอนุญาตน้อยและไม่มีความสามารถ
    it('should return LOW stability when company has no licenses', async () => {

      mockBotApiService.searchAuthorizedCompany.mockResolvedValue([
        { Id: '456', AuthorizedName: 'Bank B' },
      ]);
      mockBotApiService.getCompanyLicenseDetails.mockResolvedValue({
        AuthorizationInfo: {
          DepositFlag: 'F',
          LoanFlag: 'F',
          HPLSFlag: 'F',
        },
        LicenseInformations: [],
        Branches: null,
      });

      const result = await service.analyzeBusiness('Bank B');

      // ตรวจสอบระดับความมั่นคงระดับต่ำ
      expect(result.data.licenseSummary.total).toBe(0);
      expect(result.data.stability.score).toBe(0);
      expect(result.data.stability.level).toBe('LOW');
    });
  });
});
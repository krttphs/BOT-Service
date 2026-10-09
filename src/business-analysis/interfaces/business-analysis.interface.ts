// ข้อมูลการอนุญาตของบริษัทจาก BOT
export interface CompanyDetails {
  Id: string;
  AuthorizedName: string;
}

export interface LicenseInformation {
  PermitDate: string;
  StartDate: string;
  EndDate: string;
  Id: string;
  Code: string;
  Name: string;
  StatusCode: string;
  StatusName: string;
  LcnNo: string;
}

export interface CompanyLicenseDetails {
  AuthorizationInfo: Record<string, string>;
  LicenseInformations: LicenseInformation[];
  Branches: unknown;
}

export interface BusinessStabilityResult {
  company: {
    id: string;
    name: string;
    type: string;
    address: string;
  };
  licenseSummary: {
    total: number;
    active: number;
    inactive: number;
    licenses: LicenseInformation[];
  };
  serviceCapabilities: {
    deposit: boolean;
    loan: boolean;
    hpls: boolean;
  };
  stability: {
    score: number;
    level: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

// โครงสร้าง Response จาก BOT License API
export interface BotLicenseSearchResponse {
  result: {
    data: {
      data_detail: {
        Id: string;
        AuthorizedName: string;
      }[];
    };
  };
}

export interface BotLicenseDetailResponse {
  result: {
    data: {
      data_detail: CompanyLicenseDetails;
    };
  };
}

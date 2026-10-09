// ข้อมูลอัตราดอกเบี้ย BIBOR แต่ละรายการจาก BOT
export interface BiborRateData {
  period: string;
  [key: string]: string;
}

// โครงสร้าง Response หลักที่ได้รับจาก BOT API
export interface BotBiborResponse {
  result: {
    timestamp: string;
    api: string;

    data: {
      data_header: {
        report_name_eng: string;
        report_name_th: string;
        report_uoq_name_eng: string;
        report_uoq_name_th: string;
        report_source_of_data: {
          source_of_data_eng: string;
          source_of_data_th: string;
        }[];
        report_remark: {
          report_remark_eng: string;
          report_remark_th: string;
        }[];
        last_updated: string;
      };

      data_detail: BiborRateData[];
    };
  };
}

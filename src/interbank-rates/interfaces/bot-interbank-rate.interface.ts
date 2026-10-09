// ข้อมูลอัตราดอกเบี้ยระหว่างธนาคารแต่ละรายการจาก BOT
export interface InterbankRateData {
  period: string;
  term_type_name_th: string;
  term_type_name_eng: string;
  min_interest_rate: string;
  max_interest_rate: string;
  mode_interest_rate: string;
  weighted_average_interest_rate: string;
}

// โครงสร้าง Response หลักที่ได้รับจาก BOT API
export interface BotInterbankRateResponse {
  result: {
    timestamp: string;
    api: string;

    data: {
      // ข้อมูลส่วนหัวของรายงาน
      data_header: {
        report_name_eng: string;
        report_name_th: string;
        report_uoq_name_eng: string;
        report_uoq_name_th: string;

        // แหล่งที่มาของข้อมูล
        report_source_of_data: {
          source_of_data_eng: string;
          source_of_data_th: string;
        }[];

        // หมายเหตุของข้อมูล
        report_remark: {
          report_remark_eng: string;
          report_remark_th: string;
        }[];

        last_updated: string;
      };

      // ข้อมูลอัตราดอกเบี้ยระหว่างธนาคาร
      data_detail: InterbankRateData[];
    };
  };
}

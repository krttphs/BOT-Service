/**
 * Mock BOT API server
 * -------------------
 * จำลอง endpoint ของธนาคารแห่งประเทศไทย เพื่อยิง load test ได้โดยไม่กระทบ ธปท.
 * (ไม่ต้องลง dependency ใช้ http ของ Node ล้วนๆ)
 *
 * วิธีใช้:
 *   node mock-bot.js            # รันที่ port 9099
 *   PORT=9099 node mock-bot.js
 *
 * แล้วตั้งใน .env ของแอป NestJS:
 *   BOT_API_BASE_URL=http://localhost:9099
 */
import http from 'node:http';

const PORT = Number(process.env.PORT ?? 9099);

// ---- ตัวอย่างข้อมูล (shape ตรงกับที่ service ฝั่งแอป parse) ----
const loanDetail = [
  {
    period: '2025-10-01',
    bank_type_name_th: 'ธนาคารพาณิชย์จดทะเบียนในประเทศ',
    bank_type_name_eng: 'Commercial banks registered in Thailand',
    bank_name_th: 'ธนาคารทดสอบ',
    bank_name_eng: 'Test Bank',
    mor: '7.000',
    mlr: '7.500',
    mrr: '8.100',
    default_rate: '15.000',
  },
];

const exchangeDetail = [
  {
    period: '2025-01-01',
    currency_id: 'USD',
    currency_name_th: 'ดอลลาร์สหรัฐ',
    currency_name_eng: 'US Dollar',
    buying_sight: '33.50',
    buying_transfer: '33.60',
    selling: '34.00',
    mid_rate: '33.80',
  },
];

const biborDetail = [
  { period: '2025-10-01', overnight: '1.75', month_1: '1.80', avg_rate: '1.78' },
];

const interbankDetail = [
  {
    period: '2025-10-01',
    term_type_name_eng: 'OVERNIGHT',
    term_type_name_th: 'ข้ามคืน',
    weighted_average_interest_rate: '1.80',
    max_interest_rate: '1.90',
    min_interest_rate: '1.70',
  },
];

const seriesList = [
  {
    series_code: 'MOCK_01',
    series_name_th: 'ตัวชี้วัดทดสอบ',
    series_name_eng: 'Mock indicator',
    last_update_date: new Date().toISOString().split('T')[0],
  },
];

const holidays = [{ date: '2024-01-01', name_th: 'วันขึ้นปีใหม่' }];

const searchResult = [{ Id: '101', AuthorizedName: 'บริษัท ทดสอบ จำกัด' }];

const authorizedDetail = {
  AuthorizationInfo: {
    AuthorizedName: 'บริษัท ทดสอบ จำกัด',
    TypeName: 'นิติบุคคล',
    Address: '1 ถนนทดสอบ กรุงเทพฯ',
    DepositFlag: 'T',
    LoanFlag: 'T',
    HPLSFlag: 'F',
  },
  LicenseInformations: [{ StatusCode: '1', LicenseName: 'ใบอนุญาตทดสอบ' }],
  Branches: [],
};

// ---- จับคู่ path -> response ----
function routeResponse(pathname) {
  if (pathname.includes('/LoanRate/'))
    return { result: { data: { data_detail: loanDetail } } };
  if (pathname.includes('QUARTERLY_AVG_EXG_RATE'))
    return { result: { data: { data_detail: exchangeDetail } } };
  if (pathname.includes('/BIBOR/'))
    return { result: { data: { data_detail: biborDetail } } };
  if (pathname.includes('INTRBNK_TXN_RATE'))
    return { result: { data: { data_detail: interbankDetail } } };
  if (pathname.includes('series_list'))
    return { result: seriesList };
  if (pathname.includes('financial-institutions-holidays'))
    return { result: { data: { data_detail: holidays } } };
  if (pathname.includes('SearchAuthorized'))
    return { ResultSet: searchResult };
  if (pathname.includes('AuthorizedDetail'))
    return authorizedDetail;
  return null;
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);
  const body = routeResponse(pathname);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (body === null) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'mock: unknown path', path: pathname }));
    return;
  }
  res.statusCode = 200;
  res.end(JSON.stringify(body));
});

server.listen(PORT, () => {
  console.log(`Mock BOT API listening on http://localhost:${PORT}`);
  console.log(`ตั้งใน .env:  BOT_API_BASE_URL=http://localhost:${PORT}`);
});

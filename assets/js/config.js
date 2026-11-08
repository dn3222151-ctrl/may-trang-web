/* ==========================================================================
   MÂY TRẮNG – Cấu hình chung
   File duy nhất cần sửa khi kết nối Supabase.
   ========================================================================== */
window.MT = window.MT || {};

MT.config = {
  appName: 'Mây Trắng',
  version: '2.0.0',
  storagePrefix: 'mt.v2.',
  seedVersion: 4,

  brand: {
    name: 'Mây Trắng',
    legal: 'Hộ kinh doanh Mây Trắng',
    tagline: 'Mỹ phẩm thuần lành từ thiên nhiên Việt',
    hotline: '1900 6363',
    email: 'hello@maytrang.vn',
    address: 'Số 18 Nguyễn Văn Huyên, Cầu Giấy, Hà Nội',
    taxCode: '0108 452 771',
    website: 'maytrang.vn',
  },

  /* ---------------------------------------------------------------------
     KẾT NỐI SUPABASE
     1. Tạo project tại https://supabase.com
     2. Chạy file supabase/schema.sql rồi supabase/seed.sql trong SQL Editor
     3. Dán Project URL + anon public key bên dưới (hoặc nhập trong
        Dashboard > Cài đặt > Kết nối Supabase).
     Khi để trống, toàn bộ ứng dụng chạy bằng localStorage và mọi phép
     tính toán vẫn hoạt động đầy đủ.
     --------------------------------------------------------------------- */
   supabase: {
    url: 'https://mklpaariqxxesjfzhiub.supabase.co',
    anonKey: 'sb_publishable_dSFVV_GuuDOOnRhb58wd0A_GY0FTepf',
    evidenceBucket: 'task-evidence',
  },

  payment: {
    bankId: 'VCB',
    bankName: 'Vietcombank',
    accountNo: '0071 0012 3456 7',
    accountName: 'HO KINH DOANH MAY TRANG',
    transferPrefix: 'MAYTRANG',
  },

  admin: {
    demoEmail: 'admin@maytrang.vn',
  },

  limits: {
    evidenceImageMaxPx: 1200,
    evidenceQuality: 0.72,
    evidenceFileMaxMB: 1.2,
    maxCartQty: 20,
  },
};

MT.config.supabaseReady = function () {
  return Boolean(
    String(MT.config.supabase.url || '').trim() &&
    String(MT.config.supabase.anonKey || '').trim()
  );
};

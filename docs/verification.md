# Verification

## Environment

- Windows, Node.js 24, pnpm 12.11.2
- Redis 7.4 Alpine (via Docker Compose / portable runner)
- PostgreSQL 17 Alpine (via Docker Compose / managed PostgreSQL)
- Next.js 16.4.5, NestJS 11 / Fastify
- Database: dedicated `portfolio_demo`, role `portfolio_demo_reader`

## Commands and Results

| Command                  | Result    | Notes                                                         |
| ------------------------ | --------- | ------------------------------------------------------------- |
| `pnpm format:check`      | passed    | Tất cả file tuân thủ chuẩn Prettier                           |
| `pnpm lint`              | passed    | ESLint + Oxlint hoàn thành không có lỗi                       |
| `pnpm typecheck`         | passed    | TypeScript typecheck vượt qua toàn bộ monorepo                |
| `pnpm test` (Unit tests) | 94 passed | 72 contracts + 2 web + 20 API unit tests                      |
| `pnpm build`             | passed    | `@portfolio/contracts`, `@portfolio/api` và Next.js web build |
| `pnpm test:e2e`          | 47 passed | Khi có Redis & PostgreSQL khả dụng                            |

## SQL Sandbox Verification

- Payload unsafe `' OR '1'='1' --` → trả về toàn bộ 3 bản ghi demo.
- Payload safe với cùng nội dung trên → trả về 0 bản ghi (ngăn chặn thành công injection).
- Payload chứa dấu chấm phẩy `'; DROP TABLE ...` → bị từ chối 400 ngay tại parser; bảng dữ liệu được bảo vệ an toàn.
- Lỗi cú pháp SQL → chuẩn hóa thành mã 400 chung chung, không làm lộ câu lệnh SQL hay stack trace.
- Thử nghiệm hàm `pg_sleep` → bị chặn bởi statement timeout trong ~250ms.
- Kiểm tra trực tiếp tại tầng database: các lệnh `UPDATE` / `INSERT` từ role `portfolio_demo_reader` bị từ chối với mã lỗi `25006` / `42501`.
- Quota bảo vệ SQL: request thứ 31 từ một IP trong vòng 1 phút bị chặn với HTTP 429 và kèm header `Retry-After`.

## Contact Endpoint Verification

- Request hợp lệ → trả về `202 accepted`, email gửi tới địa chỉ server định sẵn (`CONTACT_TO_EMAIL`).
- Gửi kèm honeypot (field `website`) → trả về `202 accepted` nhưng không thực hiện gọi API gửi mail.
- Request cố tình truyền field `to` từ client → bị parser từ chối với HTTP 400.
- Sự cố từ phía provider gửi mail (Resend 401/500) → API chuẩn hóa thành mã generic `503 Service Unavailable`.
- Tin nhắn tiếng Việt có dấu dài 2000 ký tự → được xử lý thành công `202 accepted`.
- Body vượt quá giới hạn 16 KiB → bị từ chối với HTTP 413.
- Quota bảo vệ contact: request thứ 4 từ một địa chỉ IP trong vòng 1 phút bị chặn với HTTP 429.

## Rate Limiting and Abuse Protection Verification

- Cả hai thuật toán Fixed Window và Sliding Window Log phản hồi chính xác 200/429 theo hạn mức cấu hình.
- Các request gửi đồng thời (concurrency) không làm vượt quá hạn mức tối đa.
- Reset session xóa metadata và state → các request gửi tới session cũ sau đó nhận HTTP 410 Gone.
- Kiểm thử giả lập mất kết nối Redis: `/api/v1/health/ready` trả về `503`, các endpoint tạo session và liên hệ trả về `503`.

## Live Cloud Verification (Vercel & Render)

- **Frontend URL**: `https://backend-portfolio-ten-tau.vercel.app`
- **Backend API URL**: `https://backend-portfolio-api-a85n.onrender.com/api/v1`
- **Health Readiness**: `https://backend-portfolio-api-a85n.onrender.com/api/v1/health/ready` trả về HTTP 200 `{ "status": "ready", "redis": "up" }`.
- **Rate-limit Playground**: Hoạt động mượt mà trên browser, tạo session, burst, hiển thị 200/429 và đọc đầy đủ header `Retry-After`.
- **SQL Sandbox**: Phản hồi chính xác giữa 2 chế độ safe và unsafe trên database cloud PostgreSQL.
- **Contact Form**: Hoạt động với Resend provider API, bảo vệ spam bằng Honeypot và quota IP.
- **CORS & Headers**: Cấu hình `CORS_ORIGIN` trên Render khớp chính xác với origin Vercel, trình duyệt không bị chặn CORS.

## Not Verified

- **Tên miền custom riêng (Custom domain)**: Hiện tại dự án đang sử dụng subdomain mặc định do Vercel (`.vercel.app`) và Render (`.onrender.com`) cung cấp. Gửi mail Resend sử dụng domain mặc định `onboarding@resend.dev` tới email đăng ký của chủ tài khoản.

## Limitations

- Gói hosting miễn phí có thể gặp hiện tượng cold start khi không có request trong thời gian dài.
- Quota chống lạm dụng ở tầng ứng dụng không thay thế cho hệ thống WAF/Anti-DDoS chuyên dụng.
- Chế độ `unsafe` trong SQL playground được cố tình mở cho mục đích học tập và trình diễn kỹ thuật; hệ thống được cách ly nhiều tầng nhưng không nên áp dụng mô hình này cho production API thật.

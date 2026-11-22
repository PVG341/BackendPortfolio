# API và bảo mật

Base path: `/api/v1`. JSON body giới hạn tối đa 16 KiB. Payload nghiêm ngặt, sử dụng exact-key parser, không chấp nhận field lạ.

| Method | Path                            | Thành công                           | Lỗi chính                     |
| ------ | ------------------------------- | ------------------------------------ | ----------------------------- |
| GET    | /health                         | 200 `{status: "ok"}`                 | –                             |
| GET    | /health/live                    | 200 `{status: "alive"}`              | lỗi process                   |
| GET    | /health/ready                   | 200 `{status: "ready", redis: "up"}` | 503                           |
| POST   | /playground/rate-limit/session  | 201 Session                          | 400 / 429 service / 503       |
| POST   | /playground/rate-limit/request  | 200 Decision                         | 400 / 410 / 429 / 503         |
| DELETE | /playground/rate-limit/session  | 204                                  | 400 / 429 service / 503       |
| POST   | /playground/sql-injection/query | 200 rows                             | 400 / 429 service / 503       |
| POST   | /contact                        | 202 `{status: "accepted"}`           | 400 / 413 / 429 service / 503 |

Tất cả response đều mang header `Cache-Control: no-store`.

## Rate Limit Response

- Decision body: `allowed`, `algorithm`, `limit`, `remaining`, `resetAt` (epoch milliseconds), `retryAfterMs`.
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (epoch seconds); 429 thêm `Retry-After` (số giây, làm tròn lên).
- **Hai loại 429**:
  - Quota demo: Decision `allowed: false`, được biểu diễn là rate limited trên giao diện và chart.
  - Quota bảo vệ dịch vụ: `{scope: "service", message, retryAfterMs}`, không tính là kết quả thuật toán; client dừng burst và hiển thị lỗi riêng.

## Abuse Quotas

| Scope   | IP / phút | Toàn service / phút |
| ------- | --------- | ------------------- |
| session | 30        | 300                 |
| request | 120       | 3000                |
| sql     | 30        | 300                 |
| contact | 3         | 30                  |

- IP thô không lưu trong Redis; chỉ lưu HMAC-SHA256 kết hợp `ABUSE_KEY_SECRET`.
- Namespace riêng biệt cho từng loại thao tác (`portfolio:abuse:...`).
- Redis Lua script thực thi kiểm tra và tăng quota nguyên tử (atomic), key tự expire.
- Khi Redis outage hoặc command timeout, API trả về `503`, không fallback sang bộ đếm memory.

## SQL Sandbox Controls

- Database PostgreSQL riêng biệt chỉ chứa dữ liệu giả lập (`demo.users`).
- Role kết nối: `portfolio_demo_reader` chỉ có quyền `SELECT` trên `demo.users`.
- Role cấu hình `default_transaction_read_only = on`, `statement_timeout = '250ms'`, `lock_timeout = '250ms'`, `connection_limit = 4`.
- Mỗi query từ API được bọc trong giao dịch `BEGIN READ ONLY` và `SET LOCAL statement_timeout`.
- Pool kết nối nhỏ (`max: 2`), `connectionTimeoutMillis: 1500`, query timeout phía client `1000ms`.
- Input được kiểm tra nghiêm ngặt: ký tự ASCII in được, độ dài 1–64 ký tự, cấm dấu chấm phẩy `;` để ngăn stacked queries.
- `safe` mode dùng parameterized query `$1`. `unsafe` mode nối chuỗi có kiểm soát chỉ để minh họa giáo dục; không có endpoint nào cho phép thực thi SQL tùy ý.
- Lỗi database được chuẩn hóa thành mã lỗi HTTP chung chung (400 hoặc 503); không trả về stack trace, câu lệnh SQL hoặc chi tiết Postgres ra client.

## Contact Controls

- Validate chính xác các trường: `name` (1–100), `email` (đúng format RFC/HTML5, max 254), `message` (1–2000), `website` (honeypot, max 100).
- Nếu honeypot `website` có giá trị, API trả về ngay `202 accepted` nhưng âm thầm không gọi provider Resend.
- Người nhận email luôn cố định ở server qua biến `CONTACT_TO_EMAIL`; client không thể chỉ định trường `to`.
- Email gửi đi chỉ dùng plain text; email của khách truy cập được gắn vào `Reply-To`.
- Timeout gọi Resend tối đa 5 giây; lỗi từ phía Resend trả về mã generic `503 Service Unavailable`, không làm lộ API key hay payload.
- Quota bảo vệ riêng: tối đa 3 lượt gửi/IP/phút và 30 lượt/service/phút.

## CORS

- `CORS_ORIGIN` là exact origin của frontend, không có dấu slash `/` ở cuối.
- Origin không khớp sẽ bị từ chối 403 (khi có `Origin` header).
- Expose các headers: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- CORS không phải authentication; request từ CLI hoặc curl không gửi `Origin` vẫn được phục vụ theo đúng chuẩn HTTP API.

## Secrets và Failure Handling

- Secret lưu ở môi trường backend (`REDIS_URL`, `DEMO_DATABASE_URL`, `ABUSE_KEY_SECRET`, `RESEND_API_KEY`), tuyệt đối không đưa vào biến `NEXT_PUBLIC_*`, Git hay logs.
- Lỗi Redis: toàn bộ các endpoint rate limit và contact trả về `503`, `/health/ready` trả về `503`. Không dùng in-memory counter thay thế.
- Lỗi Postgres: chỉ riêng endpoint SQL sandbox trả về `503`; readiness của toàn hệ thống vẫn phản ánh tình trạng Redis.
- Lỗi Resend: trả về generic `503` cho contact endpoint.

## Limitations

- Quota bảo vệ dịch vụ là lớp phòng thủ ứng dụng, không thay thế Cloudflare/WAF hay bảo vệ DDoS tầng mạng.
- Dữ liệu demo là hư cấu và không bao giờ dùng chung tài khoản/database với dữ liệu thật.
- Ứng dụng không có cơ chế tài khoản người dùng hay session đăng nhập; session token chỉ là bearer capability tạm thời (15 phút).
- Chế độ `unsafe` trong SQL sandbox là cố ý dễ bị tấn công để phục vụ mục đích trình diễn kỹ thuật; các lớp bảo vệ bên dưới (reader role, read-only tx, timeout) đảm bảo phạm vi tấn công bị triệt tiêu hoàn toàn.

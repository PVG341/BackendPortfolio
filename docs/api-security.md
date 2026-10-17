# API và bảo mật

Base path: `/api`. POST/DELETE chỉ nhận JSON nhỏ (4 KiB). Payload nghiêm ngặt, không chấp nhận field lạ.

| Method | Path                           | Thành công                           | Lỗi chính               |
| ------ | ------------------------------ | ------------------------------------ | ----------------------- |
| GET    | /health/live                   | 200 `{status: "alive"}`              | lỗi process             |
| GET    | /health/ready                  | 200 `{status: "ready", redis: "up"}` | 503                     |
| POST   | /playground/rate-limit/session | 201 Session                          | 400 / 429 service / 503 |
| POST   | /playground/rate-limit/request | 200 Decision                         | 400 / 410 / 429 / 503   |
| DELETE | /playground/rate-limit/session | 204                                  | 400 / 429 service / 503 |

Tạo session: `{"limit":5,"windowSeconds":10}`. Limit 1–20; windowSeconds 1–60; cả hai là số nguyên. Gửi request: `{"token":"<64 ký tự hex>","algorithm":"fixed"}`; algorithm `fixed` hoặc `sliding`. Reset: `{"token":"<64 ký tự hex>"}`.

Decision: `allowed`, `algorithm`, `limit`, `remaining`, `resetAt` (epoch milliseconds), `retryAfterMs`. Headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (epoch seconds); 429 thêm `Retry-After` (số giây, làm tròn lên). Tất cả response có `Cache-Control: no-store`.

## Hai loại 429

- Quota demo: Decision `allowed:false`, được biểu diễn là rate limited trong chart.
- Quota bảo vệ dịch vụ: `{scope:"service", message, retryAfterMs}`, không tính là kết quả thuật toán; client dừng burst và hiển thị lỗi riêng.

## Protection

Quota bảo vệ / phút: tạo/xóa phiên 30/IP và 300 toàn dịch vụ; request 120/IP và 3000 toàn dịch vụ. Redis Lua thực hiện atomically và key tự expire. Các quota này giảm lạm dụng demo; không thay WAF hay bảo vệ chống DDoS.

IP chỉ được hash trong Redis key; không lưu IP thô. `TRUST_PROXY_HOPS=0` local; `1` trên Render theo proxy topology được cấu hình. Không bật trust proxy rộng tùy ý vì có thể giả IP hoặc làm nhiều người chia sẻ một IP.

`WEB_ORIGIN` là danh sách exact origins phân tách bằng dấu phẩy, không dấu slash cuối. Origin khác bị 403. Request không có Origin (CLI) vẫn hợp lệ: CORS không phải authentication. Không có cookies hoặc account trong MVP.

Redis URL ở backend environment, không đưa vào NEXT_PUBLIC_ variables, Git hoặc logs. Không có fallback memory, clock từ client, key từ client, endpoint liệt kê session, hay FLUSHDB.

Session token chỉ nằm trong state tab; không gửi analytics hay localStorage. Token hết hạn sau 15 phút. Redis restart có thể làm mất quota/phiên vì demo là ephemeral. Dùng noeviction để tránh ngầm xóa counter khi memory đầy; command lỗi trả 503.

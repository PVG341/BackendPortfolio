# Deployment

## Status

- **Local Redis + PostgreSQL + API + Web**: Verified.
- **Docker Compose stack**: Cấu hình `compose.yaml` (full stack) và `compose.redis.yaml` (dev infra) đã sẵn sàng.
- **GitHub Actions CI**: Workflow `.github/workflows/ci.yml` đã được định nghĩa (`ci`, `docker`, `secret-scan`).
- **Render & Vercel deployment**: Đã deploy và xác minh hoạt động thực tế thành công:
  - Frontend: `https://backend-portfolio-ten-tau.vercel.app`
  - Backend API: `https://backend-portfolio-api-a85n.onrender.com/api/v1`
  - Health readiness: `https://backend-portfolio-api-a85n.onrender.com/api/v1/health/ready` -> `{"status":"ready","redis":"up"}`

## Local Development

1. Khởi động hạ tầng cơ sở dữ liệu (Redis + Postgres):
   ```bash
   docker compose -f compose.redis.yaml up -d --wait
   ```
2. Cấu hình môi trường:
   - `apps/api/.env` (từ `apps/api/.env.example`)
   - `apps/web/.env.local` (`NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`)
3. Chạy ứng dụng:
   ```bash
   pnpm dev
   ```
   - Web: `http://localhost:3000`
   - API: `http://localhost:3001/api/v1`
   - Health readiness: `http://localhost:3001/api/v1/health/ready`

## Docker Full Stack

Khi chạy toàn bộ stack thông qua Docker:

```bash
docker compose up --build
```

- Khởi động 4 container: Redis 7.4, Postgres 17 (kèm init script `docker/sql`), NestJS API (:3001) và Next.js Web (:3000).
- `apps/web/Dockerfile` nhận build-arg `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`.

## Render (API + Redis)

Tạo dịch vụ qua tính năng **Blueprint** từ file `render.yaml`:

1. Kết nối repository trên Render Dashboard và trỏ vào Blueprint `render.yaml`.
2. Điền các biến môi trường manual (`sync: false`):
   - `CORS_ORIGIN`: Origin chính xác của Vercel (ví dụ: `https://your-portfolio.vercel.app`, không trailing slash).
   - `ABUSE_KEY_SECRET`: Chuỗi hex ngẫu nhiên tối thiểu 32 ký tự.
   - `DEMO_DATABASE_URL`: Connection string PostgreSQL của user reader (ví dụ từ Neon/Supabase), kèm `?sslmode=require`. **Không dùng URL của user owner**.
   - `RESEND_API_KEY`: API key bắt đầu bằng `re_...`.
   - `CONTACT_TO_EMAIL`: Địa chỉ email nhận tin nhắn từ form liên hệ.
3. Health check path được đặt là `/api/v1/health/ready`.
4. `TRUST_PROXY_HOPS = 1` phù hợp với cấu trúc proxy của Render.
5. `autoDeployTrigger: checksPass` đảm bảo chỉ deploy khi các check trên GitHub Actions đạt trạng thái xanh.

## Vercel (Frontend Next.js)

1. Import repository vào Vercel.
2. Root Directory:
   - **Tùy chọn A (Root `apps/web`)**: Chọn root `apps/web`, bật checkbox _“Include source files outside of the Root Directory”_. Build command: `cd ../.. && pnpm --filter @portfolio/contracts build && pnpm --filter @portfolio/web build`. Install command: `cd ../.. && pnpm install --frozen-lockfile`.
   - **Tùy chọn B (Root `./`)**: Đặt root là `./`. Build command: `pnpm --filter @portfolio/contracts build && pnpm --filter @portfolio/web build`. Output directory: `apps/web/.next`. Install command: `pnpm install --frozen-lockfile`.
3. Biến môi trường trên Vercel:
   - `NEXT_PUBLIC_API_URL = https://<tên-api-render>.onrender.com/api/v1` (bắt buộc có `/api/v1`, không trailing slash).
4. Lưu ý: `NEXT_PUBLIC_API_URL` được đóng cứng vào file client JS khi build; nếu thay đổi URL API trên Render, bắt buộc phải trigger rebuild trên Vercel.

## Environment Matrix

| Biến                  | Nơi sử dụng | Mục đích                  | Ví dụ                                            |
| --------------------- | ----------- | ------------------------- | ------------------------------------------------ |
| `PORT`                | API         | Cổng lắng nghe HTTP       | `3001` (local), `10000` (Render)                 |
| `NODE_ENV`            | API / Web   | Chế độ runtime            | `development` / `production`                     |
| `REDIS_URL`           | API         | Kết nối Redis             | `redis://127.0.0.1:6379`                         |
| `CORS_ORIGIN`         | API         | Cho phép frontend gọi API | `http://localhost:3000` / `https://*.vercel.app` |
| `TRUST_PROXY_HOPS`    | API         | Đọc đúng IP sau proxy     | `0` (local), `1` (Render)                        |
| `ABUSE_KEY_NAMESPACE` | API         | Prefix key chống lạm dụng | `portfolio`                                      |
| `ABUSE_KEY_SECRET`    | API         | Key bí mật băm IP         | Chuỗi ngẫu nhiên 32+ ký tự                       |
| `DEMO_DATABASE_URL`   | API         | Kết nối Postgres reader   | `postgresql://portfolio_demo_reader:...`         |
| `RESEND_API_KEY`      | API         | Gửi mail liên hệ          | `re_...`                                         |
| `CONTACT_TO_EMAIL`    | API         | Email nhận thư            | `you@example.com`                                |
| `CONTACT_FROM_EMAIL`  | API         | Sender email              | `onboarding@resend.dev`                          |
| `NEXT_PUBLIC_API_URL` | Web         | Endpoint API cho frontend | `http://localhost:3001/api/v1`                   |

## Pre-public Checklist

- [ ] GitHub Actions CI chạy pass toàn bộ job `ci`, `docker` và `secret-scan`.
- [ ] Không có file `.env` hay secret bị lộ trong git history.
- [ ] Endpoint `/api/v1/health/ready` trả về `200` khi Redis sẵn sàng, `503` khi Redis gián đoạn.
- [ ] Rate limit trả về đúng quyết định 200/429 và đầy đủ headers `X-RateLimit-*`, `Retry-After`.
- [ ] SQL sandbox: payload `unsafe` trả dữ liệu minh họa; payload `safe` không bị injection; cấm dấu chấm phẩy `;`.
- [ ] Contact form: gửi thành công trả `202`; honeypot không kích hoạt gửi email; payload chứa trường lạ bị từ chối 400.
- [ ] CORS cho phép frontend đọc được headers; không có lỗi CORS trên domain chính thức.

## Cold Start

- Trên các gói hosting miễn phí (như Render free tier), container API có thể bị tạm dừng khi không có lưu lượng truy cập.
- Giao diện người dùng Next.js được thiết kế để tự động thăm dò `/api/v1/health/ready` với exponential backoff tối đa 90 giây khi phát hiện API đang khởi động.
- Giao diện có nút thử lại sau khi hết thời gian chờ và **tuyệt đối không tự động phát lại (replay) các request POST** để bảo toàn tính toàn vẹn của hạn mức rate limit.

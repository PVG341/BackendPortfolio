# Triển khai sau khi duyệt frontend

Hiện tại ưu tiên chạy local. Chưa có URL public; không cần tạo tài khoản hosting để xem giao diện.

## Local

`docker compose up --build` chạy Redis, API port 4000 và web port 3000. Hoặc chạy Redis sẵn có và `pnpm dev`. Frontend cần `NEXT_PUBLIC_API_URL` ở lúc build; backend cần `REDIS_URL`, `WEB_ORIGIN`, `PORT`, `TRUST_PROXY_HOPS`.

## Vercel frontend

1. Import repository `https://github.com/PVG341/BackendPortfolio`.
2. Root Directory: `apps/web`, Framework: Next.js; cho phép truy cập source ngoài root (shared contracts).
3. Install: `pnpm install --frozen-lockfile`. Build: `pnpm --filter @portfolio/contracts build && pnpm --filter @portfolio/web build`.
4. Node 22; `NEXT_PUBLIC_API_URL` là API origin thực tế, không `/api` cuối; `NEXT_TELEMETRY_DISABLED=1`.
5. Deploy và dùng origin frontend thực tế làm `WEB_ORIGIN` của API.

API URL được đóng vào client bundle; thay URL phải rebuild web. Không dùng địa chỉ localhost cho public deployment.

Tham khảo [Vercel monorepos](https://vercel.com/docs/monorepos).

## Render API + Redis

`render.yaml` định nghĩa Docker API và Key Value với `plan: free`, region Singapore, private Redis connection, noeviction, health path `/api/health/ready`. Không tự tạo paid plan. Kiểm tra gói hiện có và các điều kiện tài khoản tại thời điểm tạo.

1. Kết nối repository trong Render rồi tạo Blueprint từ `render.yaml`.
2. Khi được hỏi, `WEB_ORIGIN` = origin Vercel thực tế (không slash cuối).
3. Blueprint dùng `fromService.connectionString` cho `REDIS_URL`; Redis không mở public IP.
4. API bind `0.0.0.0`, port từ môi trường; `TRUST_PROXY_HOPS=1` chỉ khi đúng proxy topology Render.
5. Auto deploy được đặt `checksPass`: cần CI của branch đạt.
6. Copy URL API thật sang Vercel và rebuild. Sau đó verify `/api/health/ready`, tạo phiên, gửi request và kiểm tra HTTP 429/Retry-After.

Tham khảo [Render Blueprint](https://render.com/docs/blueprint-spec), [Health Checks](https://render.com/docs/health-checks), [Key Value](https://render.com/docs/key-value).

## Cold start

Một số gói hosting có thể dừng instance khi không hoạt động. UI hiển thị chờ backend và probe readiness với backoff tối đa 90 giây. Sau timeout có nút thử lại. Không retry POST. Đừng dùng uptime ping liên tục để cố né chính sách gói free; chọn gói luôn chạy nếu cần độ trễ ổn định.

Redis mất dữ liệu hoặc restart khiến session nhận 410; người dùng chủ động tạo phiên mới. Redis down trả 503 và readiness thất bại, không giả vờ demo vẫn hoạt động.

## Kiểm tra trước public

- CI đạt; không secret trong source.
- WEB_ORIGIN và API URL đúng môi trường; headers được exposed cho frontend.
- Health check 200 khi Redis up, 503 khi down.
- Burst thật tạo 200/429 và Retry-After.
- Ghi URL public chỉ sau khi endpoint đã được xác minh.

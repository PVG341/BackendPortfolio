# Backend Portfolio MVP — thiết kế đề xuất

Ngày: 2026-10-11
Repository: https://github.com/PVG341/BackendPortfolio
Trạng thái: đã được người dùng duyệt và đã triển khai MVP local. Public deployment tạm hoãn theo yêu cầu xem frontend trước.

## Mục tiêu và phạm vi

Một portfolio để nhà tuyển dụng đọc kiến trúc, kiểm tra mã nguồn và trực tiếp thử rate limiting trên Redis. Giữ monorepo pnpm với Next.js frontend, NestJS backend và shared contracts. Không thêm auth, database quan hệ hay các playground khác trong MVP.

## Giao diện

- Homepage: giới thiệu Backend Developer, stack, project nổi bật, nút mở playground và repository. Chưa có tên/bio cá nhân nên không tự tạo thành tích hoặc thông tin cá nhân.
- /projects: một project Rate Limiting API, bài toán, giải pháp, giới hạn, liên kết GitHub và kiến trúc.
- /architecture: sơ đồ Browser → Next.js → NestJS → Redis, luồng request và trade-off hai thuật toán.
- /playground/rate-limit: chọn Fixed Window hoặc Sliding Window, gửi một request hoặc burst tối đa 20 request; nút dừng; reset phiên demo. Mặc định 5 request/10 giây.
- Timeline request xanh/đỏ cho 200/429; lỗi mạng/503 được biểu diễn riêng. Hiển thị latency, lượt còn lại, reset time, Retry-After, JSON và headers. Giới hạn lịch sử 200 request.
- Responsive, nhãn điều khiển rõ ràng, trạng thái không chỉ dựa vào màu sắc. Giao diện tiếng Việt với thuật ngữ kỹ thuật tiếng Anh.

## Backend và Redis

- POST /api/playground/rate-limit/session: tạo phiên demo có token ngẫu nhiên; cấu hình được kiểm tra ở server (limit 1–20, window 1–60 giây). Token không dùng làm danh tính người dùng; chỉ để cô lập phiên thử nghiệm. Metadata trong Redis có TTL, không tạo token mới tự động khi nhận 429.
- POST /api/playground/rate-limit/request: token và thuật toán; trả 200 khi cho phép, 429 khi hết quota, kèm limit, remaining, resetAt và Retry-After khi bị chặn.
- DELETE /api/playground/rate-limit/session: reset các key đúng phiên demo. Không cho client truyền Redis key tùy ý.
- Fixed Window: cửa sổ cố định theo epoch, counter và TTL; Lua thực hiện kiểm tra/cập nhật nguyên tử.
- Sliding Window Log: Redis sorted set, loại bỏ timestamp ngoài cửa sổ, đếm và thêm request được chấp nhận trong một Lua script nguyên tử. Member duy nhất cho request đồng thời; TTL dọn key không hoạt động.
- Dùng Redis TIME trong script để quyết định cửa sổ, tránh lệch đồng hồ giữa các API replica. Request bị từ chối không kéo dài cửa sổ hoặc chiếm quota.
- Namespace theo phiên và thuật toán. Giới hạn toàn cục riêng cho endpoint tạo/reset phiên và demo để hạn chế lạm dụng URL public.
- Redis không sẵn sàng: trả 503 rõ ràng, không chuyển ngầm sang bộ đếm memory. Giới hạn thời gian kết nối và lệnh Redis; tắt hàng đợi offline vô hạn.
- CORS chỉ cho origin frontend được cấu hình; validate payload, giới hạn body, không trả token/secret trong log.

## Health check và cold start

- GET /api/health/live: kiểm tra process, 200 khi server đang chạy.
- GET /api/health/ready: PING Redis với timeout; 200 khi sẵn sàng, 503 khi dependency lỗi. Hosting health check dùng endpoint ready.
- Frontend kiểm tra readiness trước khi gửi burst. Hiển thị đang khởi động; retry health GET với backoff, tổng ngân sách 90 giây, có nút thử lại sau timeout.
- Không tự retry POST demo: mỗi lần thử lại có thể tiêu thụ quota và làm sai biểu đồ.
- Startup/shutdown đóng kết nối Redis đúng cách. Docs giải thích cold start theo gói hosting; không cam kết loại bỏ độ trễ cold start.

## Kiểm thử và CI

- Unit tests: giới hạn, boundary cửa sổ, schema payload, mapping headers, không retry POST.
- Integration tests với Redis thật: request thứ 6 bị 429; quota hồi phục; sliding window loại bỏ request cũ; fixed window đổi ở boundary; request đồng thời không vượt quota; TTL; cô lập phiên; reset; Redis outage trả 503.
- Kiểm thử boundary thuật toán dùng entry point script nội bộ có clock được kiểm soát; production luôn dùng Redis TIME và không nhận clock từ client.
- Frontend tests cho trạng thái 200/429/503/cold start và điều khiển burst; smoke test ba trang và luồng gửi request.
- GitHub Actions trên pull request/push: pnpm frozen lockfile, typecheck, tests với Redis service, build cả hai app. Không cần production secret cho CI.
- Chỉ báo đã vượt kiểm thử khi có kết quả thực tế. Docker chưa có trên máy hiện tại; phải xác định cách chạy Redis thật trước integration tests.

## Deployment và tài liệu

- Khuyến nghị: Vercel cho apps/web, Render Docker service cho apps/api, Redis tương thích do nhà cung cấp hosting quản lý. Các lựa chọn này chưa xác nhận tài khoản và gói chi phí.
- Docker Compose chạy local web/API/Redis, health checks và cấu hình môi trường. Backend Dockerfile multi-stage; port từ PORT và bind 0.0.0.0.
- README hướng dẫn cài/chạy/test; docs architecture, api-security, deployment; ADR thuật toán và cách xử lý dependency outage.
- .env.example chỉ chứa ví dụ; secret Redis ở backend; frontend chỉ biết public API URL. Cấu hình GitHub URL theo repository đã cung cấp.
- Public deployment chỉ hoàn tất khi có URL thực tế và kiểm tra ready + demo 200/429 trên môi trường public. Không ghi URL giả hoặc tuyên bố public khi mới có cấu hình deploy.
- Cần quyền truy cập hosting để tạo/deploy dịch vụ; không tự đăng ký gói trả phí.

## Tiêu chí nghiệm thu

1. Homepage, Projects và Architecture hoạt động, có GitHub link đúng repository.
2. Hai thuật toán dùng Redis thật và trả HTTP 429 đúng giới hạn; visualization phản ánh response thực tế.
3. Request đồng thời không vượt quota, phiên độc lập, TTL hoạt động; Redis lỗi được phản ánh bằng 503.
4. CI có kiểm thử, typecheck và build; docs đủ chạy local và triển khai.
5. Health/readiness và cold-start UX hoạt động; không replay POST ngầm.
6. Có URL public được xác minh sau khi có quyền hosting.

# CV / Interview Notes

## One-line Pitch

Backend Software Engineer với tư duy kỹ thuật thực chiến, tập trung vào xây dựng API bảo mật, hiệu năng cao và có khả năng dự đoán chính xác hành vi dưới tải lớn: thiết kế hợp đồng dữ liệu nghiêm ngặt (strict contracts), thuật toán rate limiting nguyên tử trên Redis, sandbox SQL an toàn và ranh giới tích hợp dịch vụ chặt chẽ.

## Điểm nhấn kỹ thuật nổi bật (Highlights)

- **Redis Rate Limiting & Concurrency**:
  - Tự thiết kế và cài đặt 2 thuật toán **Fixed Window** và **Sliding Window Log** bằng Redis Lua script nguyên tử.
  - Sử dụng lệnh `TIME` của Redis làm nguồn đồng hồ duy nhất để đồng bộ thời gian trên toàn bộ cluster; kiên quyết không fallback lưu vào memory khi Redis mất kết nối nhằm đảm bảo tính trung thực của hệ thống.
  - Phân tách rạch ròi giữa hạn mức demo và quota bảo vệ dịch vụ (HMAC-SHA256 băm IP + Redis namespace).
- **Phòng thủ SQL Injection theo chiều sâu (Defense-in-Depth)**:
  - Xây dựng sandbox SQL độc lập trên PostgreSQL với role chuyên biệt `portfolio_demo_reader` (SELECT-only, `default_transaction_read_only = on`).
  - Ép buộc giao dịch `BEGIN READ ONLY`, statement timeout 250ms, pool kết nối nhỏ (`max: 2`), kiểm duyệt cấm dấu chấm phẩy `;` và chuẩn hóa toàn bộ lỗi database.
- **Ranh giới tích hợp Email & Chống Spam**:
  - Xây dựng endpoint liên hệ với server-controlled recipient, cơ chế Honeypot âm thầm triệt tiêu bot spam mà không tốn quota provider.
  - Tích hợp Resend qua plain-text email an toàn, gắn visitor email vào `Reply-To` và chuẩn hóa lỗi 503 khi nhà cung cấp gặp sự cố.
- **Monorepo & Chất lượng mã nguồn**:
  - Cấu trúc pnpm monorepo chia sẻ contracts TypeScript giữa NestJS Fastify backend và Next.js frontend.
  - Bộ kiểm thử toàn diện: **94 unit tests** (72 contracts, 2 web, 20 API unit) và **47 e2e integration tests** chạy trên cơ sở dữ liệu thật.

## Các câu hỏi phỏng vấn trọng tâm & Hướng trả lời (Interview Talking Points)

1. **Tại sao lại dùng Redis `TIME` thay vì đồng hồ của Node.js / máy chủ ứng dụng?**
   - _Trả lời_: Khi hệ thống mở rộng lên nhiều container/replica API, đồng hồ phần cứng của các server có thể bị lệch (clock drift). Nếu dùng timestamp của máy chủ ứng dụng, client gửi request tới 2 container khác nhau có thể bị tính sai cửa sổ. Sử dụng `TIME` trực tiếp trong Lua script đảm bảo tính nguyên tử tuyệt đối và đồng nhất 100% về mặt thời gian.

2. **So sánh đánh đổi giữa Fixed Window và Sliding Window Log?**
   - _Trả lời_: Fixed Window tối ưu bộ nhớ O(1) và CPU cực thấp, nhưng có thể chịu lượng request gấp đôi quota tại thời điểm giao nhau giữa 2 bucket. Sliding Window Log giải quyết triệt để vấn đề này, tính toán chính xác tuyệt đối theo mili-giây, nhưng đổi lại tốn O(limit) bộ nhớ để lưu giữ timestamp trong sorted set và chi phí CPU để dọn dẹp log.

3. **Tại sao khi Redis chết lại trả về 503 thay vì fallback sang lưu đếm tạm trong RAM (in-memory fallback)?**
   - _Trả lời_: Trong kiến trúc phân tán có nhiều replica, in-memory counter sẽ làm mất tính nhất quán (client có thể gửi gấp N lần quota bằng cách phân tán request tới các replica khác nhau). Việc trả về 503 thể hiện triết lý thiết kế fail-closed: thẳng thắn báo lỗi phụ thuộc hệ thống thay vì giả vờ hoạt động nhưng vi phạm hợp đồng bảo vệ dịch vụ.

4. **Tại sao endpoint SQL demo chế độ `unsafe` nối chuỗi mà vẫn an toàn trên môi trường public?**
   - _Trả lời_: An toàn nhờ nguyên lý defense-in-depth: database tách biệt hoàn toàn; role kết nối bị thu hồi quyền ghi ở tầng DBMS; phiên truy vấn ép `BEGIN READ ONLY`; câu lệnh có timeout 250ms; parser cấm dấu `;` để chống stacked query; và có quota bảo vệ 30 req/IP/phút.

5. **Tại sao lỗi từ database và email provider luôn được bọc thành mã lỗi generic (400/503)?**
   - _Trả lời_: Để chống rò rỉ thông tin (Information Leakage). Các thông báo lỗi chi tiết, tên bảng, cấu trúc schema hay lỗi phản hồi từ API bên thứ ba có thể là manh mối quý giá cho kẻ tấn công thực hiện fingerprinting hệ thống.

# ADR 0002 — Isolated SQL injection sandbox

Trạng thái: Accepted

## Bối cảnh (Context)

Portfolio cần một module trực quan để người xem (nhà tuyển dụng, kỹ sư) thấy rõ sự khác biệt giữa câu truy vấn dễ bị tổn thương (concatenated SQL) và câu truy vấn an toàn (parameterized query), đồng thời hiểu cách thức hệ thống phòng thủ trước các cuộc tấn công SQL injection. Tuy nhiên, việc mở một endpoint có thể chạy SQL không an toàn ra internet là một rủi ro bảo mật cực lớn nếu không được cô lập chặt chẽ.

## Quyết định (Decision)

1. **Cơ sở dữ liệu độc lập**: Dùng một instance PostgreSQL riêng biệt, chỉ chứa bảng `demo.users` với dữ liệu giả lập. Tuyệt đối không dùng chung database, schema hay cluster với bất kỳ dữ liệu thực tế nào.
2. **Quyền hạn tối thiểu (Least Privilege)**: Kết nối API sử dụng role `portfolio_demo_reader`, chỉ được cấp quyền `SELECT` trên `demo.users`.
3. **Phòng thủ theo chiều sâu (Defense in Depth)**:
   - Cấu hình role: `default_transaction_read_only = on`, `statement_timeout = '250ms'`, `lock_timeout = '250ms'`, `connection_limit = 4`.
   - Cấu hình tại session/query: API luôn bọc câu truy vấn trong khối giao dịch `BEGIN READ ONLY` và thiết lập `SET LOCAL statement_timeout = 250`.
4. **Kiểm soát kết nối**: Pool kết nối cực nhỏ (`max: 2`), `connectionTimeoutMillis: 1500`, và có timeout query phía client 1s để dự phòng.
5. **Kiểm duyệt đầu vào**: Chỉ nhận payload JSON dạng `{ mode, username }`. Giá trị `username` bị giới hạn trong khoảng 1–64 ký tự ASCII in được; cấm tuyệt đối dấu chấm phẩy `;` để ngăn chặn kỹ thuật stacked statements.
6. **Không mở endpoint SQL tùy ý**: Ứng dụng chỉ chạy một mẫu câu lệnh duy nhất định sẵn; không có endpoint nào nhận câu lệnh SQL tự do từ client.
7. **Chuẩn hóa lỗi**: Tất cả lỗi cú pháp, vi phạm quyền hoặc timeout đều được chuẩn hóa thành mã lỗi HTTP chung chung (400 hoặc 503); không bao giờ trả về stack trace, chi tiết lỗi Postgres hay câu lệnh SQL gốc ra client.

## Hệ quả (Consequences)

- Module demo phụ thuộc vào việc PostgreSQL đang hoạt động; khi database gặp sự cố, endpoint trả về 503 mà không ảnh hưởng tới các chức năng khác (như Rate Limiter).
- Chế độ `unsafe` vẫn là một attack surface có chủ đích, nhưng nhờ hệ thống rào chắn nhiều lớp (SELECT-only role, read-only transaction, timeout 250ms, quota 30 req/IP/phút, không stacked queries), rủi ro đã được triệt tiêu hoàn toàn.
- Mô hình này phù hợp cho việc minh họa giáo dục; không được xem là giải pháp để xây dựng một dịch vụ database multi-tenant cho người dùng chạy SQL tự do.

## Các giải pháp thay thế đã xem xét (Alternatives Considered)

- **Sử dụng in-memory mock data**: Bị từ chối vì không phản ánh được hành vi thực tế của database engine thật, không minh họa được tính năng read-only transaction hay statement timeout của PostgreSQL.
- **Sử dụng SQLite in-memory**: Bị từ chối vì SQLite không có hệ thống phân quyền role, không có cấu hình statement timeout và transaction read-only sâu như PostgreSQL.
- **Mở endpoint cho phép chạy SQL tùy ý**: Bị từ chối vì quá nguy hiểm và không cần thiết cho mục đích trình diễn.

## Kiểm chứng (Verification)

Xem chi tiết trong [docs/verification.md](file:///D:/This%20PC/Documents/Projects/Portfolio_backend_2/docs/verification.md): kiểm thử payload safe/unsafe, từ chối dấu chấm phẩy, timeout 250ms khi dùng `pg_sleep`, chặn các lệnh `INSERT`/`UPDATE` ở tầng database và chuẩn hóa mã lỗi.

# ADR 0003 — Contact delivery through Resend

Trạng thái: Accepted

## Bối cảnh (Context)

Portfolio cần một kênh liên hệ công khai để khách truy cập hoặc nhà tuyển dụng có thể gửi tin nhắn trực tiếp từ website. Thách thức đặt ra là làm thế nào để xây dựng endpoint này an toàn, không làm lộ địa chỉ email cá nhân ra frontend, ngăn chặn việc bot lạm dụng máy chủ làm trạm chuyển tiếp spam (open email relay), và phòng chống các cuộc tấn công spam/DDoS.

## Quyết định (Decision)

1. **Parser nghiêm ngặt**: Chỉ nhận đúng các trường `{ name, email, message, website? }`; từ chối ngay lập tức nếu client gửi thêm bất kỳ trường lạ nào khác (exact keys validation).
2. **Kỹ thuật Honeypot**: Trường `website` đóng vai trò là bẫy bot (ẩn đối với người dùng thông thường bằng CSS). Nếu trường này có giá trị (do bot tự động điền form), API trả về HTTP `202 Accepted` giả lập thành công nhưng âm thầm không gọi Resend để gửi mail.
3. **Kiểm soát người nhận ở phía máy chủ**: Địa chỉ email nhận thư luôn được cố định ở biến môi trường backend (`CONTACT_TO_EMAIL`). Client không có quyền chỉ định hay thay đổi người nhận `to`.
4. **Bảo mật nội dung và danh tính**:
   - Địa chỉ email của khách chỉ được gắn vào header `Reply-To`.
   - Nội dung thư gửi đi chỉ dùng plain-text thuần túy, tiêu đề cố định để loại bỏ nguy cơ chèn mã độc HTML/CSS vào email.
5. **Giao tiếp provider bảo mật**:
   - Sử dụng Resend HTTP API trực tiếp từ tiến trình NestJS API.
   - Khi chưa xác thực custom domain, sử dụng sender mặc định `onboarding@resend.dev` (chỉ gửi về email chính chủ tài khoản Resend).
   - Thiết lập timeout gọi Resend tối đa 5 giây.
6. **Hạn mức chống lạm dụng riêng biệt**: Áp dụng quota nghiêm ngặt trong Redis: tối đa 3 request / IP / phút và 30 request / toàn bộ dịch vụ / phút.
7. **Chuẩn hóa lỗi**: Khi Resend gặp sự cố hoặc sai API key, API trả về mã lỗi HTTP `503 Service Unavailable` chung chung; tuyệt đối không để lộ chi tiết lỗi từ Resend ra ngoài client.
8. **Bảo vệ khóa bí mật**: `RESEND_API_KEY` chỉ tồn tại ở biến môi trường backend; không bao giờ in payload hay secret ra log.

## Hệ quả (Consequences)

- Chức năng liên hệ phụ thuộc vào Redis (để kiểm tra rate limit) và dịch vụ bên thứ ba Resend (để gửi thư).
- Trong giai đoạn dùng sender onboarding của Resend, chỉ có thể gửi thư về đúng email đăng ký tài khoản Resend cho đến khi hoàn tất verify domain riêng.
- Cơ chế honeypot và abuse quota giảm thiểu đáng kể spam từ bot tự động, nhưng không thay thế hoàn toàn cho CAPTCHA trong các kịch bản bị tấn công spam quy mô lớn.

## Kiểm chứng (Verification)

Xem chi tiết trong [docs/verification.md](file:///D:/This%20PC/Documents/Projects/Portfolio_backend_2/docs/verification.md): kiểm thử gửi thành công 202, honeypot không kích hoạt gửi thư, từ chối request cố tình inject trường `to`, chuẩn hóa lỗi 503 khi provider thất bại, kiểm soát giới hạn body 16 KiB và chặn request thứ 4 từ cùng một IP.

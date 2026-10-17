# ADR 0001 — Redis và Lua cho rate limiting

Ngày: 2026-10-11. Trạng thái: accepted theo thiết kế MVP.

## Bối cảnh

Demo phải dùng chung state giữa API replicas và không vượt quota dưới concurrency. Counter memory không đáp ứng điều này; nhiều Redis calls tách rời có race condition.

## Quyết định

Redis giữ session và state. Lua thực hiện atomic check/update/expiry. Redis TIME làm đồng hồ duy nhất. Fixed Window dùng counter hash; Sliding Window Log dùng sorted set. Hai thuật toán có key độc lập trong một phiên.

## Hệ quả

Cần Redis để demo hoạt động. Redis unavailable trả 503, không fallback. Sliding Window Log tốn O(limit) memory và O(log n) cho insertion/removal; batch cleanup tùy số entry hết hạn. Giới hạn cấu hình nhỏ phù hợp public playground. TTL và noeviction giúp state được quản lý rõ ràng. Free hosting có thể cold start; UI chờ readiness nhưng không replay POST.

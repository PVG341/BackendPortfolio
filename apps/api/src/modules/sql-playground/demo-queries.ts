export const SAFE_DEMO_QUERY = 'SELECT id, username, role FROM demo.users WHERE username = $1';

export function buildUnsafeDemoQuery(username: string): string {
  // Cố ý nối chuỗi để minh họa SQL injection.
  // Chỉ chạy trong DB demo read-only, không dùng cho production.
  return `SELECT id, username, role FROM demo.users WHERE username = '${username}'`;
}

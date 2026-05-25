# Chức năng AI Chatbot tư vấn sản phẩm

## 1. Mục tiêu của chức năng

Chức năng này tạo một chatbot nhỏ cho website bán quần áo PHP + MySQL.

Chatbot hiện tại **không dùng AI thật như OpenAI/Gemini** và **không cần API key**. Nó hoạt động theo kiểu demo RAG đơn giản:

- Người dùng nhập câu hỏi trên giao diện web.
- JavaScript gửi câu hỏi đó qua API PHP.
- PHP đọc dữ liệu trong MySQL.
- PHP tìm sản phẩm/chính sách phù hợp.
- PHP tự ghép câu trả lời và trả về cho giao diện chat.

Nói ngắn gọn: chatbot chỉ trả lời dựa trên dữ liệu đang có trong database của website.

## 2. RAG đơn giản ở đây là gì?

RAG là viết tắt của Retrieval Augmented Generation.

Trong đồ án này có thể hiểu đơn giản như sau:

- `Retrieval`: tìm dữ liệu liên quan trong database, ví dụ bảng `sanpham`.
- `Generation`: tạo câu trả lời dựa trên dữ liệu vừa tìm được.

Ví dụ người dùng hỏi:

```text
Quần dưới 100k
```

Backend sẽ hiểu:

- Cần tìm loại sản phẩm: `Quần`
- Cần lọc giá: nhỏ hơn `100000`
- Tìm trong bảng `sanpham`
- Trả về danh sách sản phẩm phù hợp

Chatbot này chưa dùng mô hình ngôn ngữ lớn, nên phần `Generation` chỉ là PHP ghép chuỗi trả lời. Sau này nếu muốn thông minh hơn, có thể lấy dữ liệu tìm được trong database rồi gửi qua OpenAI/Gemini để AI viết câu trả lời tự nhiên hơn.

## 3. Các file đã thêm

### 3.1. `main/assets/css/chatbot.css`

File này chứa giao diện chatbot:

- Nút chat nổi ở góc phải màn hình.
- Khung chat khi bấm mở.
- Tin nhắn của người dùng.
- Tin nhắn của bot.
- Ô nhập câu hỏi.
- Nút gửi.

File này chỉ lo phần hiển thị, không xử lý database.

### 3.2. `main/assets/js/chatbot.js`

File này xử lý phần frontend của chatbot.

Nhiệm vụ chính:

- Mở/đóng khung chat.
- Lấy câu hỏi người dùng nhập.
- Hiển thị tin nhắn người dùng lên khung chat.
- Gửi câu hỏi tới API:

```text
main/api/ai_chatbot.php
```

- Nhận câu trả lời từ PHP.
- Hiển thị câu trả lời của bot.

Đoạn quan trọng là:

```javascript
fetch(API_URL, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    body: JSON.stringify({ question: cleanQuestion })
});
```

Đoạn này có nghĩa là JavaScript gửi câu hỏi qua phương thức `POST` dưới dạng JSON.

Ví dụ dữ liệu gửi đi:

```json
{
  "question": "Quần dưới 100k"
}
```

### 3.3. `main/api/db_connect.php`

File này dùng để kết nối MySQL.

Cấu hình quan trọng:

```php
$DB_HOST = "localhost";
$DB_USER = "root";
$DB_PASS = "vertrigo";
$DB_NAME = "qlquanao";
$DB_PORT = 3306;
```

Nếu máy bạn dùng cấu hình khác thì sửa tại đây.

Ví dụ:

- Database không tên `qlquanao` thì sửa `$DB_NAME`.
- Password MySQL không phải `vertrigo` thì sửa `$DB_PASS`.
- MySQL chạy port khác `3306` thì sửa `$DB_PORT`.

File này còn thử thêm một số cấu hình local phổ biến như:

- `localhost`
- `127.0.0.1`
- mật khẩu `vertrigo`
- mật khẩu rỗng

Mục đích là giúp chạy dễ hơn trên Vertrigo/local server.

### 3.4. `main/api/ai_chatbot.php`

Đây là file backend chính của chatbot.

Nhiệm vụ:

- Nhận câu hỏi từ frontend.
- Chuẩn hóa câu hỏi.
- Tách từ khóa.
- Tìm chính sách trong bảng `store_policies` nếu có.
- Tìm sản phẩm trong bảng `sanpham`.
- Ghép câu trả lời.
- Trả JSON về cho JavaScript.

API trả về dạng JSON:

```json
{
  "success": true,
  "answer": "Tôi tìm thấy 2 sản phẩm phù hợp...",
  "sources": {
    "products": [],
    "policies": []
  }
}
```

### 3.5. `main/api/chatbot_policies.sql`

File SQL mẫu để tạo bảng chính sách/FAQ.

Nếu import file này vào phpMyAdmin, chatbot có thể trả lời thêm các câu như:

- Chính sách đổi trả
- Giao hàng
- Liên hệ cửa hàng

Bảng được tạo là:

```sql
store_policies
```

File này không bắt buộc. Nếu chưa import, chatbot vẫn tìm sản phẩm bình thường.

## 4. File HTML đã sửa

File đã sửa:

```text
main/user/user.html
```

Đã thêm CSS chatbot trong phần `<head>`:

```html
<link rel="stylesheet" href="../assets/css/chatbot.css">
```

Đã thêm giao diện chatbot gần cuối file:

```html
<button type="button" class="chatbot-fab" id="chatbotFab">
    <span class="material-symbols-outlined">smart_toy</span>
</button>

<section class="chatbot-widget hidden" id="chatbotWidget">
    ...
</section>
```

Đã thêm JavaScript chatbot:

```html
<script src="../assets/js/chatbot.js"></script>
```

## 5. Luồng hoạt động chi tiết

### Bước 1: Người dùng bấm nút chat

Trong `user.html` có nút:

```html
<button class="chatbot-fab" id="chatbotFab">
```

Khi bấm nút này, `chatbot.js` sẽ mở khung chat.

### Bước 2: Người dùng nhập câu hỏi

Ví dụ:

```text
Có áo nam nào còn hàng không?
```

### Bước 3: JavaScript gửi câu hỏi sang PHP

File `chatbot.js` gửi câu hỏi đến:

```text
main/api/ai_chatbot.php
```

Dữ liệu gửi đi là JSON:

```json
{
  "question": "Có áo nam nào còn hàng không?"
}
```

### Bước 4: PHP nhận câu hỏi

Trong `ai_chatbot.php`, hàm này đọc câu hỏi:

```php
function getInputQuestion()
```

Nó đọc dữ liệu từ:

```php
php://input
```

vì JavaScript gửi JSON bằng `fetch()`.

### Bước 5: PHP chuẩn hóa câu hỏi

Ví dụ câu hỏi:

```text
Có áo nam nào còn hàng không?
```

sẽ được chuẩn hóa gần giống:

```text
co ao nam nao con hang khong
```

Mục đích:

- Dễ nhận biết từ khóa hơn.
- Người dùng gõ có dấu hoặc không dấu đều dễ xử lý hơn.

### Bước 6: PHP xác định điều kiện tìm kiếm

Với câu:

```text
Có áo nam nào còn hàng không?
```

Backend hiểu:

- Có chữ `ao` nên lọc `loai_sp` là áo.
- Có chữ `nam` nên lọc `gt_sp` là nam.
- Có chữ `con hang` nên lọc `soluong > 0`.

SQL sẽ tìm trong bảng:

```text
sanpham
```

Các cột quan trọng:

```text
id
ten_sp
loai_sp
gt_sp
soluong
gia
mo_ta
hinh_anh
```

### Bước 7: PHP trả kết quả

Nếu tìm thấy sản phẩm, PHP trả lời kiểu:

```text
Tôi tìm thấy 2 sản phẩm phù hợp trong hệ thống:
- Áo thun đen lưu niệm của WinWinStore | Áo | Nam | 30.000đ | còn 14 sản phẩm
```

Nếu không tìm thấy dữ liệu, PHP trả:

```text
Xin lỗi, hiện tại tôi chưa có thông tin về nội dung này.
```

### Bước 8: JavaScript hiển thị câu trả lời

`chatbot.js` nhận JSON từ PHP rồi đưa nội dung `answer` vào khung chat.

## 6. Các kiểu câu hỏi chatbot đang hiểu

### 6.1. Hỏi theo loại sản phẩm

Ví dụ:

```text
Áo nam
Quần nữ
Giày nam
Váy
```

Chatbot sẽ lọc theo cột:

```text
loai_sp
```

### 6.2. Hỏi theo giới tính

Ví dụ:

```text
Đồ nam
Đồ nữ
Unisex
```

Chatbot sẽ lọc theo cột:

```text
gt_sp
```

### 6.3. Hỏi theo tồn kho

Ví dụ:

```text
Có áo nam nào còn hàng không?
Quần nào còn hàng?
```

Chatbot sẽ thêm điều kiện:

```sql
soluong > 0
```

### 6.4. Hỏi theo giá

Ví dụ:

```text
Quần dưới 100k
Áo dưới 50k
Giày trên 100k
Sản phẩm giá rẻ
```

Chatbot sẽ lọc theo cột:

```text
gia
```

Ví dụ:

```text
dưới 100k
```

tương đương SQL:

```sql
gia < 100000
```

### 6.5. Hỏi mô tả sản phẩm

Ví dụ:

```text
Mô tả áo thun
Thông tin chi tiết giày
Chất liệu áo
```

Nếu sản phẩm có dữ liệu ở cột `mo_ta`, chatbot sẽ đưa mô tả vào câu trả lời.

### 6.6. Hỏi tổng số sản phẩm

Ví dụ:

```text
Có tất cả bao nhiêu sản phẩm?
Tổng sản phẩm là bao nhiêu?
```

Chatbot sẽ không tìm theo tên sản phẩm nữa, mà chạy câu SQL thống kê:

```sql
SELECT COUNT(*) AS total_products, COALESCE(SUM(soluong), 0) AS total_stock FROM sanpham
```

Kết quả trả về gồm:

- Số mẫu sản phẩm trong bảng `sanpham`.
- Tổng số lượng tồn kho cộng từ cột `soluong`.

## 7. Vì sao không cần API key?

Vì bản hiện tại không gọi OpenAI, Gemini hay dịch vụ AI bên ngoài.

Chatbot chỉ dùng:

- HTML
- CSS
- JavaScript
- PHP
- MySQL

Do đó không cần:

- API key
- tài khoản OpenAI
- tài khoản Gemini
- train model
- server riêng

## 8. Lỗi 500 lúc trước là do đâu?

Lỗi `500 Internal Server Error` trước đó xảy ra khi chatbot gửi câu hỏi bằng `POST`.

Nguyên nhân nằm trong file:

```text
main/api/ai_chatbot.php
```

Hàm gây lỗi là:

```php
function tableExists($conn, $tableName)
```

Ban đầu hàm này dùng:

```php
$stmt = $conn->prepare("SHOW TABLES LIKE ?");
$stmt->bind_param("s", $tableName);
$stmt->execute();
$stmt->store_result();
return $stmt->num_rows > 0;
```

Trên môi trường PHP/MySQL local của Vertrigo, câu `SHOW TABLES LIKE ?` dùng với `prepare()` không ổn, làm PHP trả lỗi 500 và response rỗng.

Đã sửa thành:

```php
function tableExists($conn, $tableName) {
    $safeTableName = $conn->real_escape_string($tableName);
    $result = $conn->query("SHOW TABLES LIKE '$safeTableName'");
    return $result && $result->num_rows > 0;
}
```

Nghĩa là:

- Không dùng `prepare()` cho câu `SHOW TABLES`.
- Dùng `real_escape_string()` để làm sạch tên bảng.
- Dùng `$conn->query()` để chạy SQL trực tiếp.

Sau khi sửa, API trả `200 OK` và chatbot hoạt động lại.

## 9. Lỗi trả sai sản phẩm đã sửa như thế nào?

Ban đầu khi hỏi:

```text
Có áo nam nào còn hàng không?
```

Chatbot trả cả quần và giày nam.

Lý do là backend ghép điều kiện bằng `OR`.

Nghĩa là chỉ cần sản phẩm là `Nam` thì cũng được trả về, dù không phải `Áo`.

Sau đó đã sửa logic thành:

- Nhóm loại sản phẩm phải đúng.
- Nhóm giới tính phải đúng.
- Nhóm tồn kho phải đúng nếu người dùng hỏi còn hàng.
- Nhóm giá phải đúng nếu người dùng hỏi giá.

Ví dụ:

```text
Áo nam còn hàng
```

sẽ thành logic:

```text
loai_sp là áo
AND gt_sp là nam
AND soluong > 0
```

Nhờ vậy kết quả không còn lẫn quần/giày nữa.

## 10. Lỗi "Quần dưới 100k" đã sửa như thế nào?

Ban đầu câu:

```text
Quần dưới 100k
```

chỉ trả sản phẩm giá từ `50k` đến `100k`, nên bỏ mất sản phẩm giá `33k`, `37k`, `40k`.

Nguyên nhân là rule cũ thấy chữ `100k` rồi hiểu nhầm thành khoảng:

```sql
gia BETWEEN 50000 AND 100000
```

Đã sửa thành:

```php
if (preg_match("/duoi\s+([0-9]+)\s*k?/", $normalized, $priceMatch)) {
    $maxPrice = ((int)$priceMatch[1]) * 1000;
    $filters[] = "gia < " . $maxPrice;
}
```

Nghĩa là:

```text
dưới 100k
```

sẽ hiểu đúng là:

```sql
gia < 100000
```

## 11. Cách test API

### 11.1. Test API trực tiếp trên trình duyệt

Mở:

```text
http://127.0.0.1:8070/DoAnWeb/main/api/ai_chatbot.php
```

Nếu thấy:

```json
{
  "success": true,
  "answer": "Bạn hãy nhập câu hỏi về sản phẩm, giá, tồn kho hoặc chính sách cửa hàng nhé.",
  "sources": []
}
```

thì API đang chạy bình thường. Đây không phải lỗi.

Lý do là trình duyệt đang mở bằng `GET`, chưa gửi câu hỏi.

### 11.2. Test trong giao diện website

Mở:

```text
http://127.0.0.1:8070/DoAnWeb/main/user/user.html
```

Nhấn nút chat ở góc phải, hỏi thử:

```text
Có áo nam nào còn hàng không?
```

hoặc:

```text
Quần dưới 100k
```

## 12. Nếu muốn thêm dữ liệu chính sách

Import file:

```text
main/api/chatbot_policies.sql
```

vào database:

```text
qlquanao
```

Sau đó chatbot có thể trả lời:

```text
Chính sách đổi trả là gì?
Giao hàng thế nào?
Liên hệ cửa hàng ở đâu?
```

## 13. Nếu muốn đổi tên database hoặc bảng

### Đổi tên database

Sửa trong:

```text
main/api/db_connect.php
```

Dòng:

```php
$DB_NAME = "qlquanao";
```

### Đổi tên bảng sản phẩm

Nếu bảng sản phẩm không phải `sanpham`, sửa trong:

```text
main/api/ai_chatbot.php
```

Tìm:

```sql
FROM sanpham
```

và đổi thành tên bảng mới.

### Đổi tên cột

Chatbot hiện dùng các cột:

```text
ten_sp
loai_sp
gt_sp
soluong
gia
mo_ta
hinh_anh
```

Nếu database của bạn đặt tên khác, phải sửa lại trong câu SQL và phần tạo câu trả lời.

## 14. Hướng mở rộng sau này với AI thật

Hiện tại chatbot tự ghép câu trả lời bằng PHP.

Sau này có thể nâng cấp như sau:

1. PHP vẫn tìm dữ liệu liên quan trong MySQL.
2. Dữ liệu tìm được được gom thành `context`.
3. Gửi `context` và câu hỏi người dùng lên OpenAI/Gemini.
4. AI viết câu trả lời tự nhiên hơn.
5. PHP trả câu trả lời đó về frontend.

Điểm quan trọng: dù dùng AI thật, vẫn nên bắt AI chỉ trả lời dựa trên dữ liệu lấy từ database. Như vậy chatbot không tự bịa sản phẩm hoặc chính sách không có trong hệ thống.

## 15. Tóm tắt dễ nhớ

Chức năng chatbot gồm 4 phần:

```text
user.html
```

Hiển thị nút chat và khung chat.

```text
chatbot.css
```

Làm đẹp giao diện chatbot.

```text
chatbot.js
```

Gửi câu hỏi của người dùng đến PHP và hiển thị câu trả lời.

```text
ai_chatbot.php
```

Nhận câu hỏi, tìm trong MySQL, tạo câu trả lời.

```text
db_connect.php
```

Kết nối database.

Luồng chạy:

```text
Người dùng hỏi
-> chatbot.js gửi POST
-> ai_chatbot.php xử lý
-> db_connect.php kết nối MySQL
-> tìm bảng sanpham/store_policies
-> trả JSON
-> chatbot.js hiển thị câu trả lời
```

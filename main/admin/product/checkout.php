<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
$host = "localhost";
$user = "root";
$pass = "vertrigo";
$dbname = "qlquanao";

$conn = new mysqli($host, $user, $pass, $dbname);

// Kiểm tra kết nối
if ($conn->connect_error) {
    // Trường hợp kết nối thất bại, trả về lỗi JSON cho AJAX call
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => "Kết nối database thất bại: " . $conn->connect_error]);
    exit();
}

// Thiết lập bộ ký tự
$conn->set_charset("utf8mb4");

// Kiểm tra kết nối
if (!isset($conn)) {
    $host = "localhost"; $user = "root"; $pass = "vertrigo"; $dbname = "qlquanao";
    $conn = new mysqli($host, $user, $pass, $dbname);
    $conn->set_charset("utf8mb4");
}

// Lấy dữ liệu JSON gửi từ Javascript
$data = json_decode(file_get_contents("php://input"), true);

if (!$data || empty($data['cart'])) {
    echo json_encode(['success' => false, 'message' => 'Giỏ hàng trống!']);
    exit;
}

$cart = $data['cart'];
// Kiểm tra xem Session có tồn tại ID người dùng chưa
if (!isset($_SESSION['user_id'])) {
    // Nếu chưa đăng nhập thì báo lỗi ngay
    echo json_encode(['success' => false, 'message' => 'Bạn cần đăng nhập để thanh toán!']);
    exit;
}

// Lấy chính xác ID của người đang đăng nhập
$id_nguoidat = $_SESSION['user_id'];

// --- BẮT ĐẦU GIAO DỊCH (Transaction) ---
// Để đảm bảo nếu lỗi ở giữa thì không lưu đơn hàng rác
$conn->begin_transaction();

try {
    // 1. Tính tổng tiền (Nên tính lại ở server để bảo mật, không tin tưởng client)
    $ids = implode(',', array_map(function($item) { return intval($item['id']); }, $cart));
    $sql_price = "SELECT id, gia FROM sanpham WHERE id IN ($ids)";
    $result_price = $conn->query($sql_price);
    
    $product_prices = [];
    while($row = $result_price->fetch_assoc()) {
        $product_prices[$row['id']] = floatval($row['gia']);
    }

    $tong_tien = 0;
    foreach ($cart as $item) {
        if (isset($product_prices[$item['id']])) {
            $tong_tien += $product_prices[$item['id']] * $item['quantity'];
        }
    }

    // 2. Thêm vào bảng donhang
    $stmt = $conn->prepare("INSERT INTO donhang (id_nguoidat, tong_tien, trang_thai) VALUES (?, ?, 'dang_xu_ly')");
    $stmt->bind_param("id", $id_nguoidat, $tong_tien);
    
    if (!$stmt->execute()) {
        throw new Exception("Lỗi tạo đơn hàng: " . $stmt->error);
    }
    
    $id_donhang = $stmt->insert_id; // Lấy ID đơn hàng vừa tạo
    $stmt->close();

    // 3. Thêm vào bảng chitietdonhang
    $sql_detail = "INSERT INTO chitietdonhang (id_donhang, id_sanpham, so_luong, don_gia) VALUES (?, ?, ?, ?)";
    $stmt_detail = $conn->prepare($sql_detail);

    foreach ($cart as $item) {
        $sp_id = $item['id'];
        $sl = $item['quantity'];
        $gia = $product_prices[$sp_id];

        $stmt_detail->bind_param("iiid", $id_donhang, $sp_id, $sl, $gia);
        if (!$stmt_detail->execute()) {
            throw new Exception("Lỗi thêm chi tiết đơn hàng");
        }
        
        // (Tùy chọn) Trừ số lượng tồn kho trong bảng sanpham
        $conn->query("UPDATE sanpham SET soluong = soluong - $sl WHERE id = $sp_id");
    }
    $stmt_detail->close();

    // Hoàn tất
    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Đặt hàng thành công!', 'order_id' => $id_donhang]);

} catch (Exception $e) {
    $conn->rollback(); // Hoàn tác nếu có lỗi
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
?>
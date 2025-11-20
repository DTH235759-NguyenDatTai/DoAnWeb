<?php
header("Content-Type: application/json; charset=UTF-8");
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

// 1. Kiểm tra xem đã đăng nhập chưa
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Bạn chưa đăng nhập', 'data' => []]);
    exit;
}

// 2. Lấy ID từ Session 
$user_id = $_SESSION['user_id'];

// 3. Truy vấn SQL
$sql = "SELECT id, tong_tien, trang_thai, ngay_dat FROM donhang WHERE id_nguoidat = $user_id ORDER BY ngay_dat DESC";
$result = $conn->query($sql);

$orders = [];
while ($row = $result->fetch_assoc()) {
    $orders[] = $row;
}

echo json_encode(['success' => true, 'data' => $orders]);
$conn->close();
?>
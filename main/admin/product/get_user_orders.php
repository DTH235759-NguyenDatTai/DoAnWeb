<?php
header("Content-Type: application/json; charset=UTF-8");
require_once "db_connect.php"; 

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
<?php
header("Content-Type: application/json; charset=UTF-8");
session_start();
require_once "db_connect.php"; 

// Lấy đơn hàng kèm tên người dùng
$sql = "SELECT dh.*, tk.name as ten_khach 
        FROM donhang dh 
        JOIN taikhoan tk ON dh.id_nguoidat = tk.id 
        ORDER BY dh.ngay_dat DESC";

$result = $conn->query($sql);
$orders = [];

while ($row = $result->fetch_assoc()) {
    $orders[] = $row;
}

echo json_encode(['success' => true, 'data' => $orders]);
$conn->close();
?>
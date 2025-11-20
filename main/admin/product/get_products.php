<?php
header("Content-Type: application/json; charset=UTF-8");

// Kết nối DB
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

$sql = "SELECT * FROM sanpham ORDER BY id DESC";
$result = $conn->query($sql);

$products = [];

while ($row = $result->fetch_assoc()) {
    // Tạo URL ảnh đầy đủ
    $row["img_url"] = "uploads/" . $row["hinh_anh"];
    $products[] = $row;
}

echo json_encode(["success" => true, "data" => $products]);
$conn->close();
?>
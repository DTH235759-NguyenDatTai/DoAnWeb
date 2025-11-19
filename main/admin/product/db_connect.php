<?php
// CHỈ DÙNG 1 FILE KẾT NỐI CHUNG

header("Content-Type: application/json; charset=UTF-8");
session_start();

// Thông tin database
$host = "localhost";
$user = "root";
$pass = "vertrigo";
$dbname = "qlquanao";

// Tạo kết nối
$conn = new mysqli($host, $user, $pass, $dbname);

// Kiểm tra lỗi
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Kết nối database thất bại: " . $conn->connect_error
    ]);
    exit;
}

// Charset
$conn->set_charset("utf8mb4");
?>

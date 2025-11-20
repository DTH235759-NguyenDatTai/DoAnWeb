<?php
header("Content-Type: application/json");
session_start();
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

if (!isset($_POST['id'])) {
    echo json_encode(["success" => false, "message" => "Thiếu ID"]);
    exit;
}

$id = intval($_POST['id']);

$sql = "DELETE FROM sanpham WHERE id = $id";

if ($conn->query($sql)) {
    echo json_encode(["success" => true, "message" => "Xóa sản phẩm thành công"]);
} else {
    echo json_encode(["success" => false, "message" => "Lỗi khi xóa sản phẩm"]);
}
?>

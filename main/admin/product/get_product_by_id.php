<?php
// Tắt tất cả warning tránh phá JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Trả về JSON thuần
header("Content-Type: application/json; charset=UTF-8");

require_once "db_connect.php";

// Kiểm tra ID
if (!isset($_GET['id'])) {
    echo json_encode(["success" => false, "message" => "Thiếu ID"]);
    exit;
}

$id = intval($_GET['id']);

$sql = "SELECT * FROM sanpham WHERE id = $id";
$result = $conn->query($sql);

// Không tìm thấy
if (!$result || $result->num_rows == 0) {
    echo json_encode([
        "success" => false,
        "message" => "Không tìm thấy sản phẩm"
    ]);
    exit;
}

$row = $result -> fetch_assoc();
if(!empty($row['hinh_anh'])){
    $row['img_url'] = "uploads/" . $row['hinh_anh'];
}

// Thành công
echo json_encode([
    "success" => true,
    "data" => $row
]);

?>

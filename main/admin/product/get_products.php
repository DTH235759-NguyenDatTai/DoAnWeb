<?php
header("Content-Type: application/json; charset=UTF-8");

// Kết nối DB
require_once "db_connect.php"; 

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
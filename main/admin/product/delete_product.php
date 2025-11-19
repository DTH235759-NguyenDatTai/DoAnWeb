<?php
header("Content-Type: application/json");
require_once "db_connect.php"; 

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

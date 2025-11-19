<?php
header("Content-Type: application/json; charset=UTF-8");
require_once "db_connect.php"; 

$id = $_POST['id'];
$status = $_POST['status']; // 'da_giao' hoặc 'huy'

$sql = "UPDATE donhang SET trang_thai = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $status, $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Cập nhật trạng thái thành công!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Lỗi cập nhật']);
}
$stmt->close();
$conn->close();
?>
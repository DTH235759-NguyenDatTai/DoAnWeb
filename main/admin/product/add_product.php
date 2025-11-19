<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
require_once "db_connect.php";

// Chỉ nhận POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => "Phương thức không hợp lệ"]);
    exit();
}

// ===============================
// VALIDATE INPUT
// ===============================
$ten_sp  = trim($_POST['ten_sp'] ?? '');
$loai_sp = trim($_POST['loai_sp'] ?? '');
$gt_sp   = trim($_POST['gt_sp'] ?? '');
$soluong = intval($_POST['soluong'] ?? 0);
$gia     = floatval($_POST['gia'] ?? 0);
$mo_ta   = trim($_POST['mo_ta'] ?? '');

if ($ten_sp === "" || $loai_sp === "" || $gt_sp === "") {
    echo json_encode(['success' => false, 'message' => "Vui lòng nhập đầy đủ thông tin"]);
    exit;
}

// ===============================
// UPLOAD ẢNH
// ===============================
$uploadDir ="../uploads/";
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$file_name = null;

if (isset($_FILES['hinh_anh']) && $_FILES['hinh_anh']['error'] == 0) {

    $validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!in_array($_FILES['hinh_anh']['type'], $validTypes)) {
        echo json_encode(['success' => false, 'message' => "Chỉ chấp nhận file JPG, PNG, WEBP"]);
        exit;
    }

    if ($_FILES['hinh_anh']['size'] > 5 * 1024 * 1024) {
        echo json_encode(['success' => false, 'message' => "File quá lớn (tối đa 5MB)"]);
        exit;
    }

    $file_name = time() . "_" . basename($_FILES['hinh_anh']['name']);
    $target = $uploadDir . $file_name;

    if (!move_uploaded_file($_FILES['hinh_anh']['tmp_name'], $target)) {
        echo json_encode(['success' => false, 'message' => "Không thể upload ảnh"]);
        exit;
    }
}

// ===============================
// INSERT DATABASE
// ===============================
$sql = "
    INSERT INTO sanpham (ten_sp, loai_sp, soluong, gt_sp, gia, hinh_anh, mo_ta)
    VALUES (?, ?, ?, ?, ?, ?, ?)
";

$stmt = $conn->prepare($sql);
$stmt->bind_param(
    "ssissss",
    $ten_sp,
    $loai_sp,
    $soluong,
    $gt_sp,
    $gia,
    $file_name,
    $mo_ta
);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => "Thêm sản phẩm thành công"]);
} else {
    echo json_encode(['success' => false, 'message' => "Lỗi SQL: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>

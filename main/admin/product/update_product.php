<?php
// product/update_product.php

// Cấu hình hiển thị lỗi (để debug nếu cần, tắt khi chạy thật)
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");

// Kết nối Database
$host = "localhost";
$user = "root";
$pass = "vertrigo";
$dbname = "qlquanao";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    echo json_encode([
        'success' => false, 
        'message' => "Lỗi kết nối DB: " . $conn->connect_error
    ]);
    exit;
}

$conn->set_charset("utf8mb4");

// Chỉ nhận method POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Lấy dữ liệu từ form
$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
$ten_sp = $_POST['ten_sp'] ?? '';
$loai_sp = $_POST['loai_sp'] ?? '';
$gt_sp = $_POST['gt_sp'] ?? '';
$soluong = isset($_POST['soluong']) ? intval($_POST['soluong']) : 0;
$gia = isset($_POST['gia']) ? floatval($_POST['gia']) : 0;
$mo_ta = $_POST['mo_ta'] ?? '';

if ($id <= 0 || empty($ten_sp)) {
    echo json_encode(['success' => false, 'message' => 'Thiếu thông tin bắt buộc (ID hoặc Tên)']);
    exit;
}

// --- XỬ LÝ FILE ẢNH ---
$hinh_anh = null;

// Kiểm tra xem có file được upload không
if (isset($_FILES['hinh_anh']) && $_FILES['hinh_anh']['error'] === UPLOAD_ERR_OK) {
    $fileTmp = $_FILES['hinh_anh']['tmp_name'];
    $fileName = $_FILES['hinh_anh']['name'];
    
    // Lấy đuôi file
    $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (!in_array($fileExt, $allowed)) {
        echo json_encode(['success' => false, 'message' => 'Chỉ chấp nhận file ảnh (jpg, png, gif, webp)']);
        exit;
    }

    // Tạo tên file mới để tránh trùng lặp: time_random.jpg
    $newFileName = time() . "_" . rand(1000, 9999) . "." . $fileExt;

    // Đường dẫn lưu file. 
    // LƯU Ý: Vì file php nằm trong thư mục 'product/', 
    // nên ta dùng '../uploads/' để ra thư mục cha rồi vào uploads.
    // Nếu uploads nằm cùng cấp với file php thì sửa thành 'uploads/'
    $uploadDir = '../uploads/';
    
    // Tạo thư mục nếu chưa có
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $destPath = $uploadDir . $newFileName;

    if (move_uploaded_file($fileTmp, $destPath)) {
        $hinh_anh = $newFileName; // Upload thành công
    } else {
        echo json_encode(['success' => false, 'message' => 'Không thể lưu file ảnh. Kiểm tra quyền ghi thư mục uploads.']);
        exit;
    }
}

// --- CẬP NHẬT DATABASE ---

if ($hinh_anh) {
    // TRƯỜNG HỢP 1: Có thay đổi ảnh
    $sql = "UPDATE sanpham 
            SET ten_sp=?, loai_sp=?, gt_sp=?, soluong=?, gia=?, mo_ta=?, hinh_anh=? 
            WHERE id=?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssidssi", $ten_sp, $loai_sp, $gt_sp, $soluong, $gia, $mo_ta, $hinh_anh, $id);

} else {
    // TRƯỜNG HỢP 2: Giữ nguyên ảnh cũ (không update cột hinh_anh)
    $sql = "UPDATE sanpham 
            SET ten_sp=?, loai_sp=?, gt_sp=?, soluong=?, gia=?, mo_ta=? 
            WHERE id=?";
            
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssidsi", $ten_sp, $loai_sp, $gt_sp, $soluong, $gia, $mo_ta, $id);
}

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Cập nhật sản phẩm thành công!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Lỗi SQL: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
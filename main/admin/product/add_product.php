<?php
header("Content-Type: application/json; charset=UTF-8");

// Kết nối database
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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $ten_sp  = $_POST['ten_sp'] ?? '';
    $loai_sp = $_POST['loai_sp'] ?? '';
    $gt_sp   = $_POST['gt_sp'] ?? '';
    $soluong = $_POST['soluong'] ?? 0;
    $gia     = $_POST['gia'] ?? 0;
    $mo_ta   = $_POST['mo_ta'] ?? '';

    // =============================
    // 1. Xử lý upload ảnh
    // =============================
    if (isset($_FILES['hinh_anh']) && $_FILES['hinh_anh']['error'] === 0) {

        $folder = "../uploads/";
        if (!is_dir($folder)) {
            mkdir($folder, 0777, true);
        }

        $file_name = time() . "_" . basename($_FILES['hinh_anh']['name']);
        $target = $folder . $file_name;

        if (!move_uploaded_file($_FILES['hinh_anh']['tmp_name'], $target)) {
            echo json_encode(["success" => false, "message" => "Không thể upload hình ảnh"]);
            exit;
        }
    } else {
        $file_name = null;
    }

    // =============================
    // 2. Thêm vào database
    // =============================
    $stmt = $conn->prepare("
        INSERT INTO sanpham (ten_sp, loai_sp, soluong, gt_sp, gia, hinh_anh, mo_ta)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param("ssisdss", $ten_sp, $loai_sp, $soluong, $gt_sp, $gia, $file_name, $mo_ta);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Thêm sản phẩm thành công"]);
    } else {
        echo json_encode(["success" => false, "message" => "Lỗi SQL: " . $stmt->error]);
    }

    $stmt->close();
}

$conn->close();
?>

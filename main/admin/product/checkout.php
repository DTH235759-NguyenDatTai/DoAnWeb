<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

// =======================================
// 1) DATABASE CONFIG
// =======================================
require_once "db_connect.php"; 

// =======================================
// 2) CHECK LOGIN
// =======================================
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Bạn cần đăng nhập để thanh toán!']);
    exit;
}

$id_nguoidat = $_SESSION['user_id'];

// =======================================
// 3) LẤY JSON TỪ CLIENT
// =======================================
$data = json_decode(file_get_contents("php://input"), true);

if (!$data || empty($data['cart'])) {
    echo json_encode(['success' => false, 'message' => 'Giỏ hàng trống!']);
    exit;
}

$cart = $data['cart'];

// =======================================
// 4) VALIDATE DỮ LIỆU GIỎ HÀNG
// =======================================
$ids = [];
foreach ($cart as $item) {
    if (!isset($item['id']) || !isset($item['quantity'])) {
        echo json_encode(['success' => false, 'message' => 'Dữ liệu giỏ hàng không hợp lệ!']);
        exit;
    }
    $ids[] = intval($item['id']);
}

$ids_list = implode(",", $ids);

// =======================================
// 5) LẤY GIÁ SẢN PHẨM TỪ SERVER
// =======================================
$sql_price = "SELECT id, gia FROM sanpham WHERE id IN ($ids_list)";
$result_price = $conn->query($sql_price);

$product_prices = [];
while ($row = $result_price->fetch_assoc()) {
    $product_prices[$row['id']] = floatval($row['gia']);
}

// Kiểm tra sản phẩm tồn tại
foreach ($ids as $id_sp) {
    if (!isset($product_prices[$id_sp])) {
        echo json_encode(['success' => false, 'message' => "Sản phẩm ID $id_sp không tồn tại!"]);
        exit;
    }
}

// =======================================
// 6) TÍNH TỔNG TIỀN TẠI SERVER
// =======================================
$tong_tien = 0;

foreach ($cart as $item) {
    $sp_id = intval($item['id']);
    $soluong = intval($item['quantity']);

    if ($soluong <= 0) {
        echo json_encode(['success' => false, 'message' => 'Số lượng không hợp lệ!']);
        exit;
    }

    $tong_tien += $product_prices[$sp_id] * $soluong;
}

// =======================================
// 7) TRANSACTION: LƯU ĐƠN HÀNG
// =======================================
$conn->begin_transaction();

try {
    // 7.1 Tạo đơn hàng
    $stmt = $conn->prepare("INSERT INTO donhang (id_nguoidat, tong_tien, trang_thai) VALUES (?, ?, 'dang_xu_ly')");
    $stmt->bind_param("id", $id_nguoidat, $tong_tien);
    
    if (!$stmt->execute()) {
        throw new Exception("Lỗi tạo đơn hàng: " . $stmt->error);
    }

    $id_donhang = $stmt->insert_id;
    $stmt->close();

    // 7.2 Thêm chi tiết đơn hàng
    $stmt_detail = $conn->prepare("
        INSERT INTO chitietdonhang (id_donhang, id_sanpham, so_luong, don_gia)
        VALUES (?, ?, ?, ?)
    ");

    foreach ($cart as $item) {
        $sp_id = intval($item['id']);
        $sl = intval($item['quantity']);
        $gia = $product_prices[$sp_id];

        $stmt_detail->bind_param("iiid", $id_donhang, $sp_id, $sl, $gia);
        if (!$stmt_detail->execute()) {
            throw new Exception("Lỗi thêm chi tiết đơn hàng");
        }

        // TRỪ TỒN KHO (có kiểm tra tránh âm)
        $update = $conn->prepare("UPDATE sanpham SET soluong = GREATEST(soluong - ?, 0) WHERE id = ?");
        $update->bind_param("ii", $sl, $sp_id);
        $update->execute();
        $update->close();
    }

    $stmt_detail->close();

    // Complete transaction
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Đặt hàng thành công!',
        'order_id' => $id_donhang
    ]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>

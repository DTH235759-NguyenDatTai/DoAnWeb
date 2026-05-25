<?php
// File ket noi database dung chung cho chatbot.
// Neu may cua ban khac thong tin dang nhap, sua 4 bien ben duoi.
$DB_HOST = "localhost";
$DB_USER = "root";
$DB_PASS = "vertrigo";
$DB_NAME = "qlquanao";

$conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "answer" => "Khong the ket noi database. Vui long kiem tra db_connect.php.",
        "debug" => $conn->connect_error
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$conn->set_charset("utf8mb4");
?>

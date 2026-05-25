<?php
// File ket noi database dung chung cho chatbot.
// Neu may cua ban khac thong tin dang nhap, sua cac bien ben duoi.
$DB_HOST = "localhost";
$DB_USER = "root";
$DB_PASS = "vertrigo";
$DB_NAME = "qlquanao";
$DB_PORT = 3306;

// Vertrigo/local MySQL doi khi dung host/pass khac nhau.
// Chatbot se thu cau hinh chinh truoc, sau do thu vai cau hinh local pho bien.
$dbConfigs = [
    ["host" => $DB_HOST, "user" => $DB_USER, "pass" => $DB_PASS, "name" => $DB_NAME, "port" => $DB_PORT],
    ["host" => "127.0.0.1", "user" => $DB_USER, "pass" => $DB_PASS, "name" => $DB_NAME, "port" => $DB_PORT],
    ["host" => "localhost", "user" => "root", "pass" => "", "name" => $DB_NAME, "port" => $DB_PORT],
    ["host" => "127.0.0.1", "user" => "root", "pass" => "", "name" => $DB_NAME, "port" => $DB_PORT],
];

$conn = null;
$errors = [];

// PHP 8 co the nem mysqli_sql_exception lam response rong neu connect fail.
// Tat che do exception de chatbot luon tra ve JSON de de debug tren F12.
if (function_exists("mysqli_report")) {
    mysqli_report(MYSQLI_REPORT_OFF);
}

foreach ($dbConfigs as $config) {
    try {
        $tryConn = @new mysqli(
            $config["host"],
            $config["user"],
            $config["pass"],
            $config["name"],
            $config["port"]
        );
    } catch (Throwable $e) {
        $errors[] = $config["host"] . ":" . $config["port"] . " / user=" . $config["user"] . " / db=" . $config["name"] . " => " . $e->getMessage();
        continue;
    }

    if ($tryConn && !$tryConn->connect_error) {
        $conn = $tryConn;
        break;
    }

    $errors[] = $config["host"] . ":" . $config["port"] . " / user=" . $config["user"] . " / db=" . $config["name"] . " => " . ($tryConn ? $tryConn->connect_error : "Khong tao duoc mysqli connection");
}

if (!$conn) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "answer" => "Không thể kết nối database. Vui lòng kiểm tra tên database, user, password, port MySQL trong main/api/db_connect.php.",
        "debug" => $errors
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$conn->set_charset("utf8mb4");
?>

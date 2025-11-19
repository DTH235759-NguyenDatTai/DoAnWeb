<?php
    session_start();

    // Nếu chưa đăng nhập → vào trang đăng nhập
    if (!isset($_SESSION["user"])) {
        header("Location: login/login.php");
        exit();
    }

    // Nếu đã đăng nhập → kiểm tra role
    $user = $_SESSION["user"];

    if ($user["role"] == "admin") {
        header("Location: admin/admin.html");
    } else {
        header("Location: user/user.html");
    }
    exit();
?>

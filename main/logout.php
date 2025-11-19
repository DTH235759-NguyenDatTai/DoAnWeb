<?php
    session_start();
    session_unset(); // Xóa tất cả biến session
    session_destroy(); // Hủy phiên đăng nhập
    header("Location:login/login.php"); // Quay về trang đăng nhập
    exit();
?>

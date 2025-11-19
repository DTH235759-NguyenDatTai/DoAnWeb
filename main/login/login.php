<?php
    session_start();
    $host = "localhost";
    $user = "root";
    $pass = "vertrigo";
    $dbname = "qlquanao";

    $conn = new mysqli($host, $user, $pass, $dbname);

    if ($conn->connect_error) {
        die("Kết nối thất bại: " . $conn->connect_error);
    }

    $conn->set_charset("utf8");

    if($_SERVER["REQUEST_METHOD"] == "POST"){

        // Xác định đăng nhập hay đăng ký
        $action =  $_POST["action"];

        // Xử lí đăng ký
        if ($action == "register"){
            $name = $_POST["nickName"];
            $email = $_POST["email"];
            $password = $_POST["password"];

            $check = $conn->query("SELECT * FROM taikhoan WHERE email = '$email'");
            if($check -> num_rows > 0){
                echo "email đã tồn tại";
                exit;
            }
            $hashPass = password_hash($password, PASSWORD_DEFAULT);
            $sql = "INSERT INTO taikhoan(name, email, password) VALUES ('$name', '$email', '$hashPass')";
            $conn->query($sql);
            echo "<script> alert('Đăng ký thành công!');</script>";
        }
        // Xử lý đăng nhập
        if($action == "login"){
            $email = $_POST["email"];
            $password = $_POST["password"];

            $stmt = $conn->prepare("SELECT * FROM taikhoan WHERE email = ?");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows == 1) {
                $user = $result->fetch_assoc();

                // Kiểm tra mật khẩu (so sánh password người nhập với hash trong DB)
                if (password_verify($password, $user["password"])) {
                    $_SESSION['user_id'] = $user['id']; // Lưu ID vào session để khi người dùng đặt hàng sẽ lấy id ở đây
                    $_SESSION["user"] = $user;

                    // Kiểm tra role và chuyển hướng
                    if ($user["role"] == "admin") {
                        echo "<script>window.location.href='../admin/admin.html';</script>";
                        exit;
                    } else {
                        echo "<script>window.location.href='../user/user.html';</script>";
                        exit;
                    }
                } else {
                    echo "<script>alert('Sai mật khẩu!'); window.history.back();</script>";
                }
            } else {
                echo "<script>alert('Email không tồn tại!'); window.history.back();</script>";
            }
        }
    }
?>

    <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
            <link rel="stylesheet" href="login_style.css">
            <title>Login Page</title>
        </head>

        <body>

            <div class="container" id="container">
                <div class="form-container sign-up">
                    <form method="POST">
                        <input type="hidden" name="action" value="register">
                        <h1>Create Account</h1>
                        <div class="social-icons">
                            <a href="#" class="icon"><i class="fa-brands fa-google-plus-g"></i></a>
                            <a href="#" class="icon"><i class="fa-brands fa-facebook-f"></i></a>
                            <a href="#" class="icon"><i class="fa-brands fa-github"></i></a>
                            <a href="#" class="icon"><i class="fa-brands fa-linkedin-in"></i></a>
                        </div>
                        <span>or use your email for registeration</span>
                        <input type="text" name="nickName" placeholder="Name" required>
                        <input type="email" name="email" placeholder="Email" required>
                        <input type="password" name="password" placeholder="Password" required>
                        <button type="submit">Sign Up</button>
                    </form>
                </div>
                <div class="form-container sign-in">
                    <form method="POST" id="loginForm">
                        <input type="hidden" name="action" value="login">
                        <h1>Sign In</h1>
                        <div class="social-icons">
                            <a href="#" class="icon"><i class="fa-brands fa-google-plus-g"></i></a>
                            <a href="#" class="icon"><i class="fa-brands fa-facebook-f"></i></a>
                            <a href="#" class="icon"><i class="fa-brands fa-github"></i></a>
                            <a href="#" class="icon"><i class="fa-brands fa-linkedin-in"></i></a>
                        </div>
                        <span>or use your email password</span>
                        <input type="email" name="email" placeholder="Email" required>
                        <input type="password" name="password" placeholder="Password" required>
                        <a href="#">Forget Your Password?</a>
                        <button type="submit">Sign In</button>
                    </form>
                </div>
                <div class="toggle-container">
                    <div class="toggle">
                        <div class="toggle-panel toggle-left">
                            <h1>Welcome Back!</h1>
                            <p>Hãy nhập đầy đủ thông tin của bạn để những trải nghiệm tuyệt vời</p>
                            <button class="hidden" id="login">Sign In</button>
                        </div>
                        <div class="toggle-panel toggle-right">
                            <h1>Hello, Friend!</h1>
                            <p>Hãy nhập thông tin của bạn để có thể sử dụng hết tính năng của trang web</p>
                            <button class="hidden" id="register">Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>

            <script src="login_script.js"></script>
        </body>

    </html>
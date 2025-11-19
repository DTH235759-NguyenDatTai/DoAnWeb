-- Tạo database
CREATE DATABASE IF NOT EXISTS qlquanao 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE qlquanao;

-- ================================
-- Bảng tài khoản
-- ================================
CREATE TABLE taikhoan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user'
);

-- ================================
-- Bảng sản phẩm
-- ================================
CREATE TABLE sanpham (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_sp VARCHAR(150) NOT NULL,
    loai_sp NVARCHAR(20) NOT NULL,
    soluong INT NOT NULL,
    gt_sp NVARCHAR(20) NOT NULL,
    gia DECIMAL(10,2) NOT NULL,
    hinh_anh VARCHAR(255),
    mo_ta TEXT,
    ngay_dang TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- Bảng đơn hàng
-- ================================
CREATE TABLE donhang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_nguoidat INT NOT NULL,
    tong_tien DECIMAL(10,2) NOT NULL,
    ngay_dat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trang_thai ENUM('dang_xu_ly', 'da_giao', 'huy') DEFAULT 'da_giao',
    FOREIGN KEY (id_nguoidat) REFERENCES taikhoan(id)
);

-- ================================
-- Bảng chi tiết đơn hàng
-- ================================
CREATE TABLE chitietdonhang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_donhang INT NOT NULL,
    id_sanpham INT NOT NULL,
    so_luong INT NOT NULL DEFAULT 1,
    don_gia DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_donhang) REFERENCES donhang(id),
    FOREIGN KEY (id_sanpham) REFERENCES sanpham(id)
);

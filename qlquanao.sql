-- phpMyAdmin SQL Dump
-- version 4.8.5
-- https://www.phpmyadmin.net/
--
-- Máy chủ: localhost
-- Thời gian đã tạo: Th10 20, 2025 lúc 06:48 AM
-- Phiên bản máy phục vụ: 5.7.25
-- Phiên bản PHP: 7.1.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `qlquanao`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chitietdonhang`
--

CREATE TABLE `chitietdonhang` (
  `id` int(11) NOT NULL,
  `id_donhang` int(11) NOT NULL,
  `id_sanpham` int(11) NOT NULL,
  `so_luong` int(11) NOT NULL DEFAULT '1',
  `don_gia` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `chitietdonhang`
--

INSERT INTO `chitietdonhang` (`id`, `id_donhang`, `id_sanpham`, `so_luong`, `don_gia`) VALUES
(1, 1, 11, 2, '50000.00'),
(2, 1, 10, 2, '55000.00'),
(3, 1, 9, 2, '50000.00'),
(4, 2, 13, 1, '345000.00'),
(5, 2, 12, 1, '850000.00'),
(6, 3, 13, 1, '345000.00'),
(7, 4, 14, 1, '30000.00'),
(8, 5, 14, 1, '30000.00'),
(9, 6, 13, 1, '345000.00'),
(10, 7, 14, 1, '30000.00'),
(11, 8, 12, 1, '850000.00'),
(12, 9, 14, 1, '30000.00'),
(13, 10, 13, 1, '345000.00'),
(14, 11, 14, 1, '30000.00'),
(15, 12, 1, 11, '50000.00');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `donhang`
--

CREATE TABLE `donhang` (
  `id` int(11) NOT NULL,
  `id_nguoidat` int(11) NOT NULL,
  `tong_tien` decimal(10,2) NOT NULL,
  `ngay_dat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `trang_thai` enum('dang_xu_ly','da_giao','huy') COLLATE utf8mb4_unicode_ci DEFAULT 'da_giao'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `donhang`
--

INSERT INTO `donhang` (`id`, `id_nguoidat`, `tong_tien`, `ngay_dat`, `trang_thai`) VALUES
(1, 2, '310000.00', '2025-11-19 05:07:04', 'da_giao'),
(2, 2, '1195000.00', '2025-11-19 06:08:49', 'da_giao'),
(3, 3, '345000.00', '2025-11-19 11:38:48', 'da_giao'),
(4, 3, '30000.00', '2025-11-19 11:58:33', 'huy'),
(5, 3, '30000.00', '2025-11-19 15:38:27', 'da_giao'),
(6, 3, '345000.00', '2025-11-19 15:45:55', 'da_giao'),
(7, 2, '30000.00', '2025-11-19 16:15:03', 'da_giao'),
(8, 2, '850000.00', '2025-11-19 16:23:00', 'da_giao'),
(9, 3, '30000.00', '2025-11-19 16:39:54', 'da_giao'),
(10, 2, '345000.00', '2025-11-19 17:05:38', 'da_giao'),
(11, 2, '30000.00', '2025-11-19 17:31:47', 'da_giao'),
(12, 2, '550000.00', '2025-11-19 17:35:16', 'dang_xu_ly');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `sanpham`
--

CREATE TABLE `sanpham` (
  `id` int(11) NOT NULL,
  `ten_sp` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loai_sp` varchar(20) CHARACTER SET utf8 NOT NULL,
  `gt_sp` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `soluong` int(11) NOT NULL,
  `gia` decimal(10,2) NOT NULL,
  `hinh_anh` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `ngay_dang` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `sanpham`
--

INSERT INTO `sanpham` (`id`, `ten_sp`, `loai_sp`, `gt_sp`, `soluong`, `gia`, `hinh_anh`, `mo_ta`, `ngay_dang`) VALUES
(1, 'Áo thun đỏ sao vàng', 'Áo', 'Unisex', 0, '50000.00', '1763397739_vn-11134207-7ra0g-m93336qtp9xj06.png', 'áo đỏ', '2025-11-17 16:42:19'),
(2, 'Áo Thun Teelab Grey Trame', 'Áo', 'Unisex', 5, '70000.00', '1763400445_ao1.png', 'áo xám', '2025-11-17 17:27:25'),
(3, 'Áo Sweater Voyage Old Sailor', 'Áo', 'Unisex', 3, '195000.00', '1763400955_ao2.png', 'áo này ấm', '2025-11-17 17:35:55'),
(4, 'Áo Phông Unisex \"Minimalist\"', 'Áo', 'Unisex', 15, '189000.00', '1763401289_ao3.jpg', 'Chất liệu cotton 100% thoáng mát, form basic dễ phối đồ, phù hợp cả nam và nữ.', '2025-11-17 17:41:29'),
(5, 'Quần Jeans Jogger', 'Quần', 'Nam', 23, '40000.00', '1763401983_quan1.jpg', 'Mềm Co Giãn The Original 037 Xanh Dương Đậm', '2025-11-17 17:53:03'),
(6, 'Quần Jogger Jeans', 'Quần', 'Nam', 32, '37000.00', '1763402065_quan2.jpg', 'Co Giãn Multi Color Jean 010 Xám', '2025-11-17 17:54:25'),
(7, 'Quần Short Jean', 'Quần', 'Nam', 12, '33000.00', '1763402232_quan3.jpg', 'Lưng Thun Dễ Chịu The Original 041 Xanh Dương Nhạt', '2025-11-17 17:57:12'),
(8, 'Đầm dáng dài sọc phối ren', 'Váy', 'Nữ', 3, '40000.00', '1763402464_vay1.jpg', 'Đầm dáng dài sọc phối ren bigsize', '2025-11-17 18:01:04'),
(9, 'Bộ Đồ Nữ Mặc Nhà Phối Màu', 'Đồ bộ', 'Nữ', 41, '50000.00', '1763402704_dobo1.jpg', 'rất thích hợp mặc ở nhà', '2025-11-17 18:05:04'),
(10, 'Bộ Đồ Nữ Dài Tay Dáng Suông Phối Màu', 'Đồ bộ', 'Nữ', 30, '55000.00', '1763402771_dobo2.jpg', 'dáng suông dễ phối màu\r\n', '2025-11-17 18:06:11'),
(11, 'Quần Jeans Suông Gai Xanh', 'Quần', 'Nữ', 21, '50000.00', '1763402845_quan4.jpg', 'mặc hơi ngứa.', '2025-11-17 18:07:25'),
(12, 'Adidas Superstar André Saraiva Chalk', 'Giày dép', 'Nam', 30, '850000.00', '1763527142_giay1.jpg', 'giày này đẹp vcl', '2025-11-19 04:39:02'),
(13, 'Giày Thể Thao Nam MWC 5857', 'Giày dép', 'Nam', 8, '345000.00', '1763531750_giay2.jpg', 'Giày Da Thể Thao Nam Đi Học, Đi Chơi, Leo Núi, Chạy Bộ Siêu Bền Đẹp Trẻ Trung, Năng Động Thời trang.', '2025-11-19 05:55:50'),
(14, 'Áo thun đen lưu niệm của WinWinStore', 'Áo', 'Nam', 16, '30000.00', '1763553470_ao4.jpg', 'có thiết kế đơn giản, dễ mặc, phù hợp cho cả nam và nữ. Chất liệu 100% cotton giúp áo mềm, thoáng khí và thoải mái. Logo “W” nhỏ được in phía trước ngực trái, trong khi mặt sau có hình in lớn với logo của các thương hiệu hợp tác cùng WinWinStore.', '2025-11-19 11:57:50');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `taikhoan`
--

CREATE TABLE `taikhoan` (
  `id` int(11) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('user','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `taikhoan`
--

INSERT INTO `taikhoan` (`id`, `name`, `email`, `password`, `role`) VALUES
(1, 'admin', 'admin@gmail.com', '$2y$10$9au74VzQLp7d92Fgp3t.5OHE1V3zK2pzyX5SIjVuRmy2lLlXzc0vi', 'admin'),
(2, 'Tai', 'tai27@gmail.com', '$2y$10$dUEiJSFEkPTxDFGzU4nq6e5DRt1oKk5rkTdPv9ExNTQmwVDP0RsSO', 'user'),
(3, 'Trân', 'tran17@gmail.com', '$2y$10$Npa/J5TtBn6kPOPaUBUnPuFGybDclG449EcUUmtj5qdvzj3Z/HvNC', 'user');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `chitietdonhang`
--
ALTER TABLE `chitietdonhang`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_donhang` (`id_donhang`),
  ADD KEY `id_sanpham` (`id_sanpham`);

--
-- Chỉ mục cho bảng `donhang`
--
ALTER TABLE `donhang`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_nguoidat` (`id_nguoidat`);

--
-- Chỉ mục cho bảng `sanpham`
--
ALTER TABLE `sanpham`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `taikhoan`
--
ALTER TABLE `taikhoan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `chitietdonhang`
--
ALTER TABLE `chitietdonhang`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT cho bảng `donhang`
--
ALTER TABLE `donhang`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT cho bảng `sanpham`
--
ALTER TABLE `sanpham`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT cho bảng `taikhoan`
--
ALTER TABLE `taikhoan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `chitietdonhang`
--
ALTER TABLE `chitietdonhang`
  ADD CONSTRAINT `chitietdonhang_ibfk_1` FOREIGN KEY (`id_donhang`) REFERENCES `donhang` (`id`),
  ADD CONSTRAINT `chitietdonhang_ibfk_2` FOREIGN KEY (`id_sanpham`) REFERENCES `sanpham` (`id`);

--
-- Các ràng buộc cho bảng `donhang`
--
ALTER TABLE `donhang`
  ADD CONSTRAINT `donhang_ibfk_1` FOREIGN KEY (`id_nguoidat`) REFERENCES `taikhoan` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

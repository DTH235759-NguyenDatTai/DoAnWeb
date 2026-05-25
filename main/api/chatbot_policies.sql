-- SQL mau cho du lieu chinh sach/FAQ cua chatbot.
-- Import file nay trong phpMyAdmin vao database qlquanao neu muon bot tra loi ve doi tra, giao hang, lien he.

CREATE TABLE IF NOT EXISTS `store_policies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `keywords` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `store_policies` (`title`, `content`, `keywords`) VALUES
('Chính sách đổi trả', 'Cửa hàng hỗ trợ đổi trả trong 7 ngày nếu sản phẩm còn nguyên tem, chưa qua sử dụng và có hóa đơn mua hàng.', 'doi tra, hoan hang, tra hang, loi san pham'),
('Chính sách giao hàng', 'Đơn hàng sẽ được xử lý trong giờ làm việc. Thời gian giao hàng phụ thuộc vào địa chỉ nhận hàng và đơn vị vận chuyển.', 'giao hang, van chuyen, ship, thoi gian giao'),
('Liên hệ cửa hàng', 'Bạn có thể liên hệ cửa hàng qua trang liên hệ hoặc nhắn trực tiếp cho quản trị viên để được hỗ trợ.', 'lien he, ho tro, cham soc khach hang');

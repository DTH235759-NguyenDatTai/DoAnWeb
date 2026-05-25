<?php
// Chatbot RAG don gian: khong train AI, chi tim du lieu trong MySQL roi tao cau tra loi.
// Sau nay co the thay ham buildAnswer() bang OpenAI/Gemini API va truyen $context vao prompt.

ini_set("display_errors", 0);
error_reporting(E_ALL);
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/db_connect.php";

const FALLBACK_ANSWER = "Xin lỗi, hiện tại tôi chưa có thông tin về nội dung này.";

function jsonResponse($answer, $sources = []) {
    echo json_encode([
        "success" => true,
        "answer" => $answer,
        "sources" => $sources
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function getInputQuestion() {
    $raw = file_get_contents("php://input");
    $json = json_decode($raw, true);

    if (is_array($json) && isset($json["question"])) {
        return trim($json["question"]);
    }

    if (isset($_POST["question"])) {
        return trim($_POST["question"]);
    }

    if (is_array($json) && isset($json["message"])) {
        return trim($json["message"]);
    }

    return "";
}

function lowerText($text) {
    // Vertrigo/PHP cu co the chua bat mbstring, nen can fallback.
    if (function_exists("mb_strtolower")) {
        return mb_strtolower($text, "UTF-8");
    }
    return strtolower($text);
}

function normalizeText($text) {
    $text = lowerText($text);
    $map = [
        "à"=>"a","á"=>"a","ạ"=>"a","ả"=>"a","ã"=>"a","â"=>"a","ầ"=>"a","ấ"=>"a","ậ"=>"a","ẩ"=>"a","ẫ"=>"a","ă"=>"a","ằ"=>"a","ắ"=>"a","ặ"=>"a","ẳ"=>"a","ẵ"=>"a",
        "è"=>"e","é"=>"e","ẹ"=>"e","ẻ"=>"e","ẽ"=>"e","ê"=>"e","ề"=>"e","ế"=>"e","ệ"=>"e","ể"=>"e","ễ"=>"e",
        "ì"=>"i","í"=>"i","ị"=>"i","ỉ"=>"i","ĩ"=>"i",
        "ò"=>"o","ó"=>"o","ọ"=>"o","ỏ"=>"o","õ"=>"o","ô"=>"o","ồ"=>"o","ố"=>"o","ộ"=>"o","ổ"=>"o","ỗ"=>"o","ơ"=>"o","ờ"=>"o","ớ"=>"o","ợ"=>"o","ở"=>"o","ỡ"=>"o",
        "ù"=>"u","ú"=>"u","ụ"=>"u","ủ"=>"u","ũ"=>"u","ư"=>"u","ừ"=>"u","ứ"=>"u","ự"=>"u","ử"=>"u","ữ"=>"u",
        "ỳ"=>"y","ý"=>"y","ỵ"=>"y","ỷ"=>"y","ỹ"=>"y","đ"=>"d"
    ];
    return strtr($text, $map);
}

function hasAny($text, $words) {
    foreach ($words as $word) {
        if (strpos($text, $word) !== false) {
            return true;
        }
    }
    return false;
}

function extractKeywords($question) {
    $normalized = normalizeText($question);
    $parts = preg_split("/[^a-z0-9]+/u", $normalized);
    $stopWords = [
        "toi","minh","ban","shop","co","khong","con","hang","san","pham","tim","kiem","cho","hoi","ve","la","gi","nao","nhung",
        "mau","gia","bao","nhieu","can","mua","muon","xem","tu","den","duoi","tren","cac","mot","cai","chiec"
    ];

    $keywords = [];
    foreach ($parts as $part) {
        $part = trim($part);
        if (strlen($part) >= 2 && !in_array($part, $stopWords)) {
            $keywords[] = $part;
        }
    }

    return array_values(array_unique(array_slice($keywords, 0, 8)));
}

function tableExists($conn, $tableName) {
    $stmt = $conn->prepare("SHOW TABLES LIKE ?");
    $stmt->bind_param("s", $tableName);
    $stmt->execute();
    $stmt->store_result();
    return $stmt->num_rows > 0;
}

function searchPolicies($conn, $question, $keywords) {
    if (!tableExists($conn, "store_policies")) {
        return [];
    }

    $terms = array_merge([$question], $keywords);
    $where = [];
    $params = [];
    $types = "";

    foreach ($terms as $term) {
        $term = trim($term);
        if ($term === "") continue;
        $like = "%" . $term . "%";
        $where[] = "(title LIKE ? OR content LIKE ? OR keywords LIKE ?)";
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $types .= "sss";
    }

    if (empty($where)) return [];

    $sql = "SELECT id, title, content FROM store_policies WHERE " . implode(" OR ", $where) . " ORDER BY id DESC LIMIT 3";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $stmt->bind_result($id, $title, $content);

    $rows = [];
    while ($stmt->fetch()) {
        $rows[] = [
            "id" => $id,
            "title" => $title,
            "content" => $content
        ];
    }
    return $rows;
}

function searchProducts($conn, $question, $keywords) {
    $normalized = normalizeText($question);
    $where = [];
    $params = [];
    $types = "";

    foreach ($keywords as $keyword) {
        $like = "%" . $keyword . "%";
        $where[] = "(LOWER(ten_sp) LIKE ? OR LOWER(loai_sp) LIKE ? OR LOWER(gt_sp) LIKE ? OR LOWER(mo_ta) LIKE ?)";
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $types .= "ssss";
    }

    if (hasAny($normalized, ["ao", "shirt", "sweater"])) {
        $where[] = "LOWER(loai_sp) LIKE ?";
        $params[] = "%áo%";
        $types .= "s";
    }
    if (hasAny($normalized, ["quan", "jean", "jogger", "short"])) {
        $where[] = "LOWER(loai_sp) LIKE ?";
        $params[] = "%quần%";
        $types .= "s";
    }
    if (hasAny($normalized, ["vay", "dam"])) {
        $where[] = "(LOWER(loai_sp) LIKE ? OR LOWER(ten_sp) LIKE ?)";
        $params[] = "%váy%";
        $params[] = "%đầm%";
        $types .= "ss";
    }
    if (hasAny($normalized, ["giay", "dep"])) {
        $where[] = "LOWER(loai_sp) LIKE ?";
        $params[] = "%giày%";
        $types .= "s";
    }
    if (hasAny($normalized, ["nam"])) {
        $where[] = "LOWER(gt_sp) LIKE ?";
        $params[] = "%nam%";
        $types .= "s";
    }
    if (hasAny($normalized, ["nu"])) {
        $where[] = "LOWER(gt_sp) LIKE ?";
        $params[] = "%nữ%";
        $types .= "s";
    }
    if (hasAny($normalized, ["unisex"])) {
        $where[] = "LOWER(gt_sp) LIKE ?";
        $params[] = "%unisex%";
        $types .= "s";
    }

    $priceSql = "";
    if (hasAny($normalized, ["duoi 50", "duoi 50k", "re", "gia re"])) {
        $priceSql = " AND gia < 50000";
    } elseif (hasAny($normalized, ["50k", "100k", "50 den 100"])) {
        $priceSql = " AND gia BETWEEN 50000 AND 100000";
    } elseif (hasAny($normalized, ["tren 100", "tren 100k", "cao cap"])) {
        $priceSql = " AND gia > 100000";
    }

    $stockSql = "";
    if (hasAny($normalized, ["con hang", "ton kho", "so luong"])) {
        $stockSql = " AND soluong > 0";
    }

    if (empty($where)) {
        if ($priceSql === "" && $stockSql === "") {
            return [];
        }
        $where[] = "1=1";
    }

    $sql = "SELECT id, ten_sp, loai_sp, gt_sp, soluong, gia, mo_ta, hinh_anh
            FROM sanpham
            WHERE (" . implode(" OR ", $where) . ")" . $priceSql . $stockSql . "
            ORDER BY soluong DESC, gia ASC
            LIMIT 5";

    $stmt = $conn->prepare($sql);
    if ($types !== "") {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $stmt->bind_result($id, $ten_sp, $loai_sp, $gt_sp, $soluong, $gia, $mo_ta, $hinh_anh);

    $rows = [];
    while ($stmt->fetch()) {
        $rows[] = [
            "id" => $id,
            "ten_sp" => $ten_sp,
            "loai_sp" => $loai_sp,
            "gt_sp" => $gt_sp,
            "soluong" => $soluong,
            "gia" => $gia,
            "mo_ta" => $mo_ta,
            "hinh_anh" => $hinh_anh
        ];
    }

    return $rows;
}

function formatMoneyVnd($number) {
    return number_format((float)$number, 0, ",", ".") . "đ";
}

function buildAnswer($question, $products, $policies) {
    if (!empty($policies)) {
        $lines = ["Tôi tìm thấy thông tin chính sách trong hệ thống:"];
        foreach ($policies as $policy) {
            $lines[] = "- " . $policy["title"] . ": " . $policy["content"];
        }
        return implode("\n", $lines);
    }

    if (empty($products)) {
        return FALLBACK_ANSWER;
    }

    $normalized = normalizeText($question);
    $lines = ["Tôi tìm thấy " . count($products) . " sản phẩm phù hợp trong hệ thống:"];

    foreach ($products as $item) {
        $stock = ((int)$item["soluong"] > 0) ? "còn " . (int)$item["soluong"] . " sản phẩm" : "hết hàng";
        $desc = trim((string)$item["mo_ta"]);
        $line = "- " . $item["ten_sp"] . " | " . $item["loai_sp"] . " | " . $item["gt_sp"] . " | " . formatMoneyVnd($item["gia"]) . " | " . $stock;

        if (hasAny($normalized, ["mo ta", "chat lieu", "thong tin", "chi tiet"]) && $desc !== "") {
            $line .= " | Mô tả: " . $desc;
        }

        $lines[] = $line;
    }

    return implode("\n", $lines);
}

$question = getInputQuestion();

if ($question === "") {
    jsonResponse("Bạn hãy nhập câu hỏi về sản phẩm, giá, tồn kho hoặc chính sách cửa hàng nhé.");
}

$keywords = extractKeywords($question);
$policies = searchPolicies($conn, $question, $keywords);
$products = searchProducts($conn, $question, $keywords);
$answer = buildAnswer($question, $products, $policies);

jsonResponse($answer, [
    "products" => $products,
    "policies" => $policies
]);
?>

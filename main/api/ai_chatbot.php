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

function isProductCountQuestion($question) {
    $normalized = normalizeText($question);

    return hasAny($normalized, ["bao nhieu san pham", "tong san pham", "tat ca bao nhieu", "co tat ca bao nhieu"]);
}

function answerProductCount($conn) {
    $sql = "SELECT COUNT(*) AS total_products, COALESCE(SUM(soluong), 0) AS total_stock FROM sanpham";
    $result = $conn->query($sql);

    if (!$result) {
        return FALLBACK_ANSWER;
    }

    $row = $result->fetch_assoc();
    $totalProducts = (int)$row["total_products"];
    $totalStock = (int)$row["total_stock"];

    return "Hiện tại hệ thống có " . $totalProducts . " mẫu sản phẩm trong bảng sanpham, với tổng số lượng tồn kho là " . $totalStock . " sản phẩm.";
}

function tableExists($conn, $tableName) {
    $safeTableName = $conn->real_escape_string($tableName);
    $result = $conn->query("SHOW TABLES LIKE '$safeTableName'");
    return $result && $result->num_rows > 0;
}

function searchPolicies($conn, $question, $keywords) {
    if (!tableExists($conn, "store_policies")) {
        return [];
    }

    $terms = array_merge([$question], $keywords);
    $where = [];

    foreach ($terms as $term) {
        $term = trim($term);
        if ($term === "") continue;
        $like = "%" . $conn->real_escape_string($term) . "%";
        $where[] = "(title LIKE '$like' OR content LIKE '$like' OR keywords LIKE '$like')";
    }

    if (empty($where)) return [];

    $sql = "SELECT id, title, content FROM store_policies WHERE " . implode(" OR ", $where) . " ORDER BY id DESC LIMIT 3";
    $result = $conn->query($sql);

    $rows = [];
    if (!$result) {
        return [];
    }

    while ($row = $result->fetch_assoc()) {
        $rows[] = [
            "id" => $row["id"],
            "title" => $row["title"],
            "content" => $row["content"]
        ];
    }
    return $rows;
}

function searchProducts($conn, $question, $keywords) {
    $normalized = normalizeText($question);
    $filters = [];
    $keywordWhere = [];

    foreach ($keywords as $keyword) {
        if (preg_match("/^[0-9]+k?$/", $keyword)) {
            continue;
        }

        if (in_array($keyword, ["ao", "quan", "vay", "dam", "giay", "dep", "nam", "nu", "unisex", "con", "hang", "ton", "kho", "re"])) {
            continue;
        }

        $like = "%" . $conn->real_escape_string($keyword) . "%";
        $keywordWhere[] = "(LOWER(ten_sp) LIKE '$like' OR LOWER(loai_sp) LIKE '$like' OR LOWER(gt_sp) LIKE '$like' OR LOWER(mo_ta) LIKE '$like')";
    }

    $categoryWhere = [];
    if (hasAny($normalized, ["ao", "shirt", "sweater"])) {
        $categoryWhere[] = "LOWER(loai_sp) LIKE '%áo%'";
    }
    if (hasAny($normalized, ["quan", "jean", "jogger", "short"])) {
        $categoryWhere[] = "LOWER(loai_sp) LIKE '%quần%'";
    }
    if (hasAny($normalized, ["vay", "dam"])) {
        $categoryWhere[] = "(LOWER(loai_sp) LIKE '%váy%' OR LOWER(ten_sp) LIKE '%đầm%')";
    }
    if (hasAny($normalized, ["giay", "dep"])) {
        $categoryWhere[] = "LOWER(loai_sp) LIKE '%giày%'";
    }
    if (!empty($categoryWhere)) {
        $filters[] = "(" . implode(" OR ", $categoryWhere) . ")";
    }

    $genderWhere = [];
    if (hasAny($normalized, ["nam"])) {
        $genderWhere[] = "LOWER(gt_sp) LIKE '%nam%'";
    }
    if (hasAny($normalized, ["nu"])) {
        $genderWhere[] = "LOWER(gt_sp) LIKE '%nữ%'";
    }
    if (hasAny($normalized, ["unisex"])) {
        $genderWhere[] = "LOWER(gt_sp) LIKE '%unisex%'";
    }
    if (!empty($genderWhere)) {
        $filters[] = "(" . implode(" OR ", $genderWhere) . ")";
    }

    if (preg_match("/duoi\s+([0-9]+)\s*k?/", $normalized, $priceMatch)) {
        $maxPrice = ((int)$priceMatch[1]) * 1000;
        $filters[] = "gia < " . $maxPrice;
    } elseif (preg_match("/tren\s+([0-9]+)\s*k?/", $normalized, $priceMatch)) {
        $minPrice = ((int)$priceMatch[1]) * 1000;
        $filters[] = "gia > " . $minPrice;
    } elseif (hasAny($normalized, ["re", "gia re"])) {
        $filters[] = "gia < 50000";
    } elseif (hasAny($normalized, ["50k", "100k", "50 den 100"])) {
        $filters[] = "gia BETWEEN 50000 AND 100000";
    } elseif (hasAny($normalized, ["tren 100", "tren 100k", "cao cap"])) {
        $filters[] = "gia > 100000";
    }

    if (hasAny($normalized, ["con hang", "ton kho", "so luong"])) {
        $filters[] = "soluong > 0";
    }

    if (!empty($keywordWhere)) {
        $filters[] = "(" . implode(" OR ", $keywordWhere) . ")";
    }

    if (empty($filters)) {
        return [];
    }

    $sql = "SELECT id, ten_sp, loai_sp, gt_sp, soluong, gia, mo_ta, hinh_anh
            FROM sanpham
            WHERE " . implode(" AND ", $filters) . "
            ORDER BY soluong DESC, gia ASC
            LIMIT 5";

    $result = $conn->query($sql);

    $rows = [];
    if (!$result) {
        return [];
    }

    while ($row = $result->fetch_assoc()) {
        $rows[] = [
            "id" => $row["id"],
            "ten_sp" => $row["ten_sp"],
            "loai_sp" => $row["loai_sp"],
            "gt_sp" => $row["gt_sp"],
            "soluong" => $row["soluong"],
            "gia" => $row["gia"],
            "mo_ta" => $row["mo_ta"],
            "hinh_anh" => $row["hinh_anh"]
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

if (isProductCountQuestion($question)) {
    jsonResponse(answerProductCount($conn), [
        "type" => "product_count"
    ]);
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

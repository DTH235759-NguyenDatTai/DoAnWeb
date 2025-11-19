// GLOBAL STATE
let currentPage = 1;
let ITEMS_PER_PAGE = 9;
let productList = [];
let filteredList = [];
let currentGender = "all";

// ============================================================
// HELPERS
// ============================================================

// DOM Helper
const $ = (id) => document.getElementById(id);

// LOG
const log = console.log;

// Image Helper — chuẩn hóa hình ảnh
function resolveImagePath(sp) {
    if (sp.img_url) return "../admin/" + sp.img_url;
    return `../admin/uploads/${sp.hinh_anh}`;
}

// CART Helper
function getCart() {
    return JSON.parse(localStorage.getItem("shopping_cart")) || [];
}

function saveCart(cart) {
    localStorage.setItem("shopping_cart", JSON.stringify(cart));
}

function updateCartCount() {
    const cart = getCart();
    const total = cart.reduce((s, item) => s + item.quantity, 0);
    document.querySelectorAll(".cart-count").forEach((el) => (el.innerText = total));
}

// ============================================================
// 1. LOAD PRODUCT LIST
// ============================================================
async function loadProducts() {
    try {
        const res = await fetch("../admin/product/get_products.php");
        const data = await res.json();

        if (!data.success) return log("Server error:", data.message);

        productList = data.data || [];
        filteredList = [...productList];

        renderProducts();
        renderPagination();
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

// ============================================================
// 2. RENDER PRODUCT GRID
// ============================================================
function renderProducts() {
    const grid = document.querySelector(".product-grid");
    if (!grid) return;

    grid.innerHTML = "";

    if (filteredList.length === 0) {
        grid.innerHTML =
            "<h3 style='grid-column:1/-1;text-align:center;color:#777;'>Không có sản phẩm nào.</h3>";
        return;
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const items = filteredList.slice(start, start + ITEMS_PER_PAGE);

    items.forEach((sp) => {
        const imgSrc = resolveImagePath(sp);
        const card = document.createElement("div");
        card.className = "card";
        card.dataset.id = sp.id;

        card.innerHTML = `
            <img src="${imgSrc}" alt="${sp.ten_sp}">
            <h4>${sp.ten_sp}</h4>
            <p class="price">${Number(sp.gia).toLocaleString()}₫</p>
        `;

        card.onclick = () => openProductDetail(sp.id);
        grid.appendChild(card);
    });
}

// ============================================================
// 3. FILTERS (GENDER + CATEGORIES + PRICE)
// ============================================================

// Gender click
function filterGender(g, e) {
    if (e) {
        e.preventDefault();
        document.querySelectorAll(".main-nav a").forEach((el) => el.classList.remove("active"));
        e.target.classList.add("active");
    }

    currentGender = g;
    applyFilters();
}

// Main filter function
function applyFilters() {
    const cateSelected = [...document.querySelectorAll(".filter-card:nth-child(1) input:checked")].map(
        (i) => (i.value || i.parentElement.innerText.trim()).toLowerCase()
    );

    const priceSelected = [...document.querySelectorAll(".filter-card:nth-child(2) input:checked")].map(
        (i) => i.value || i.parentElement.innerText.trim()
    );

    filteredList = productList.filter((sp) => {
        const genderPass =
            currentGender === "all" ||
            (sp.gt_sp && sp.gt_sp.toLowerCase() === currentGender.toLowerCase());

        const catePass =
            cateSelected.length === 0 ||
            cateSelected.some((c) => sp.loai_sp?.toLowerCase().includes(c));

        const pricePass = checkPrice(sp.gia, priceSelected);

        return genderPass && catePass && pricePass;
    });

    currentPage = 1;
    renderProducts();
    renderPagination();
}

function checkPrice(price, filters) {
    if (filters.length === 0) return true;

    return filters.some((text) => {
        text = text.toLowerCase();
        if (text.includes("dưới") && price < 50000) return true;
        if (text.includes("50k") && price >= 50000 && price <= 100000) return true;
        if (text.includes("trên") && price > 100000) return true;
    });
}

// ============================================================
// 4. PAGINATION
// ============================================================
function renderPagination() {
    const totalPage = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
    const pag = document.querySelector(".pagination");

    if (!pag) return;

    pag.innerHTML = "";
    if (totalPage <= 1) return;

    const addBtn = (text, fn, disabled = false) => {
        const btn = document.createElement("button");
        btn.innerHTML = text;
        btn.disabled = disabled;
        btn.onclick = fn;
        pag.appendChild(btn);
    };

    addBtn("&lt;", () => changePage(currentPage - 1), currentPage === 1);

    for (let i = 1; i <= totalPage; i++) {
        addBtn(
            i,
            () => changePage(i),
            false,
            (btn) => btn.classList.add(i === currentPage ? "active" : "")
        );
    }

    addBtn("&gt;", () => changePage(currentPage + 1), currentPage === totalPage);
}

function changePage(p) {
    const max = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
    if (p < 1 || p > max) return;
    currentPage = p;
    renderProducts();
    renderPagination();
}

// ============================================================
// 5. PRODUCT DETAIL MODAL
// ============================================================
async function openProductDetail(id) {
    try {
        const res = await fetch(`../admin/product/get_product_by_id.php?id=${id}`);
        const data = await res.json();

        if (!data.success) return alert("Không thể tải chi tiết sản phẩm!");

        const sp = data.data;

        $("ctsp_img").src = resolveImagePath(sp);
        $("ctsp_ten").innerText = sp.ten_sp;
        $("ctsp_loai").innerText = sp.loai_sp;
        $("ctsp_gt").innerText = sp.gt_sp;
        $("ctsp_sl").innerText = sp.soluong;
        $("ctsp_gia").innerText = Number(sp.gia).toLocaleString() + "₫";
        $("ctsp_mota").innerText = sp.mo_ta || "Đang cập nhật...";
        $("ctsp_ngay").innerText = sp.ngay_dang;

        const btnAdd = $("btnThemVaoGio");
        if (btnAdd) btnAdd.dataset.id = id;

        $("modalCTSP").showModal();
    } catch (err) {
        console.error(err);
    }
}

$("btnDongCTSP")?.addEventListener("click", () => $("modalCTSP").close());

// ============================================================
// 6. ADD TO CART
// ============================================================
$("btnThemVaoGio")?.addEventListener("click", (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    const cart = getCart();
    const item = cart.find((p) => p.id == id);

    if (item) item.quantity++;
    else cart.push({ id, quantity: 1 });

    saveCart(cart);
    updateCartCount();

    $("modalCTSP").close();
    alert("Đã thêm vào giỏ hàng!");
});

// ============================================================
// 7. NOTIFICATIONS SYSTEM
// ============================================================
async function loadNotifications(isReading = false) {
    try {
        const res = await fetch("../admin/product/get_user_orders.php");
        const json = await res.json();
        if (!json.data) return;

        const notifications = json.data;

        const finished = notifications.filter(
            (o) => o.trang_thai === "da_giao" || o.trang_thai === "da_huy"
        ).length;

        const lastSeen = Number(localStorage.getItem("last_seen_orders_count") || 0);

        if (!isReading && finished > lastSeen) {
            $("notif-badge").style.display = "block";
        }

        if (isReading) {
            localStorage.setItem("last_seen_orders_count", finished);
        }

        if ($("modalThongBao").open) {
            renderNotifications(notifications);
        }
    } catch (err) {
        console.error("Notif error:", err);
    }
}

function renderNotifications(list) {
    const wrap = $("list-notif-content");
    wrap.innerHTML = "";

    if (list.length === 0) {
        wrap.innerHTML =
            "<li style='padding:20px;text-align:center;color:#777;'>Chưa có đơn hàng nào.</li>";
        return;
    }

    list.forEach((od) => {
        const statusMap = {
            dang_xu_ly: ["hourglass_empty", "orange", "Đang chờ xử lý"],
            da_giao: ["check_circle", "green", "Đã DUYỆT"],
            da_huy: ["cancel", "red", "Bị HỦY"],
        };

        const [icon, color, text] = statusMap[od.trang_thai] || ["info", "gray", od.trang_thai];

        wrap.innerHTML += `
            <li class="notif-item">
                <span class="material-symbols-outlined" style="color:${color}">${icon}</span>
                <div>
                    <div>Đơn hàng <b>#${od.id}</b>: ${text}</div>
                    <div style="font-size:.85rem;color:#666;">Tổng: ${Number(od.tong_tien).toLocaleString()}₫</div>
                    <div style="font-size:.75rem;color:#999;">${od.ngay_dat}</div>
                </div>
            </li>
        `;
    });
}

$("btnThongBao")?.addEventListener("click", async () => {
    $("modalThongBao").showModal();
    $("notif-badge").style.display = "none";
    await loadNotifications(true);
});

$("closeNotif")?.addEventListener("click", () => $("modalThongBao").close());

// ============================================================
// INIT
// ============================================================
window.onload = () => {
    loadProducts();
    updateCartCount();
    loadNotifications();

    setInterval(() => loadNotifications(), 3000);
};

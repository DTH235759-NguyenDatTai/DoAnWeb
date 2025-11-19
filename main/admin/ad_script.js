// ------------------------------
// CONSTANTS
// ------------------------------
const ITEMS_PER_PAGE = 9;
const API = {
    LIST: "product/get_products.php",
    DETAIL: id => `product/get_product_by_id.php?id=${id}`
};

// ------------------------------
// STATE
// ------------------------------
let currentPage = 1;
let productList = [];

// ------------------------------
// INIT
// ------------------------------
window.onload = () => loadProducts();

/**
 * Fetch toàn bộ sản phẩm từ server
 */
async function loadProducts() {
    try {
        const res = await fetch(API.LIST);
        const data = await res.json();

        if (!data.success) return console.error("Không load được sản phẩm");

        productList = data.data;

        renderProducts();
        renderPagination();
    } catch (err) {
        console.error("Lỗi load SP:", err);
    }
}

/**
 * Tạo URL ảnh sản phẩm
 */
function getImageSource(sp) {
    return sp.img_url || `uploads/${sp.hinh_anh}`;
}

/**
 * Tạo 1 thẻ card HTML
 */
function createProductCard(sp) {
    const img = getImageSource(sp);
    return `
        <div class="card" data-id="${sp.id}">
            <img src="${img}" alt="${sp.ten_sp}">
            <h4>${sp.ten_sp}</h4>
            <p class="price">${Number(sp.gia).toLocaleString()}₫</p>
        </div>
    `;
}

/**
 * Render danh sách sản phẩm theo trang
 */
function renderProducts() {
    const grid = document.querySelector(".product-grid");
    if (!grid) return;

    grid.innerHTML = "";

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const items = productList.slice(start, start + ITEMS_PER_PAGE);

    grid.innerHTML = items.map(createProductCard).join("");

    // Event Delegation - không dùng setTimeout
    grid.onclick = e => {
        const card = e.target.closest(".card");
        if (card) openProductDetail(card.dataset.id);
    };
}

/**
 * Render thanh phân trang
 */
function renderPagination() {
    const pag = document.querySelector(".pagination");
    if (!pag) return;

    const totalPage = Math.ceil(productList.length / ITEMS_PER_PAGE);
    pag.innerHTML = "";

    const createBtn = (page, label, disabled = false) =>
        `<button onclick="changePage(${page})" ${disabled ? "disabled" : ""}>${label}</button>`;

    // Prev
    pag.innerHTML += createBtn(currentPage - 1, "&lt;", currentPage === 1);

    // Page numbers
    for (let i = 1; i <= totalPage; i++) {
        pag.innerHTML += `
            <button class="page ${i === currentPage ? "active" : ""}"
                    onclick="changePage(${i})">${i}</button>`;
    }

    // Next
    pag.innerHTML += createBtn(currentPage + 1, "&gt;", currentPage === totalPage);
}

/**
 * Đổi trang
 */
function changePage(page) {
    const totalPage = Math.ceil(productList.length / ITEMS_PER_PAGE);
    if (page < 1 || page > totalPage) return;

    currentPage = page;
    renderProducts();
    renderPagination();
}

/**
 * Mở modal chi tiết sản phẩm
 */
async function openProductDetail(id) {
    try {
        const res = await fetch(API.DETAIL(id));
        const data = await res.json();

        if (!data.success) return alert("Không tìm thấy sản phẩm");

        const sp = data.data;
        const img = getImageSource(sp);

        // Fill UI
        document.getElementById("ctsp_img").src = img;
        document.getElementById("ctsp_ten").innerText = sp.ten_sp;
        document.getElementById("ctsp_loai").innerText = sp.loai_sp;
        document.getElementById("ctsp_gt").innerText = sp.gt_sp;
        document.getElementById("ctsp_sl").innerText = sp.soluong;
        document.getElementById("ctsp_gia").innerText = Number(sp.gia).toLocaleString() + "₫";
        document.getElementById("ctsp_mota").innerText = sp.mo_ta;
        document.getElementById("ctsp_ngay").innerText = sp.ngay_dang;

        // Gán ID cho nút sửa/xóa nếu tồn tại
        document.getElementById("btnSuaSP")?.setAttribute("data-id", id);
        document.getElementById("btnXoaSP")?.setAttribute("data-id", id);

        document.getElementById("modalCTSP").showModal();
    } catch (err) {
        console.error("Lỗi load chi tiết:", err);
    }
}
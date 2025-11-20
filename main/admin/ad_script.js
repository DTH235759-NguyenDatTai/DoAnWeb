// ============================================================
// ad_script.js - Chỉ xử lý hiển thị danh sách
// ============================================================
let currentPage = 1;
let itemsPerPage = 9;
let productList = [];

// Load trang
window.onload = () => {
    loadProducts();
};

async function loadProducts() {
    try {
        let res = await fetch("product/get_products.php");
        let data = await res.json();
        if (data.success) {
            productList = data.data;
            renderProducts();
            renderPagination();
        }
    } catch (err) { console.error("Lỗi load SP:", err); }
}

function renderProducts() {
    let grid = document.querySelector(".product-grid");
    if (!grid) return;
    grid.innerHTML = "";

    let start = (currentPage - 1) * itemsPerPage;
    let items = productList.slice(start, start + itemsPerPage);

    items.forEach(sp => {
        let imgSrc = sp.img_url ? sp.img_url : "uploads/" + sp.hinh_anh;
        let card = `
            <div class="card" data-id="${sp.id}" style="cursor: pointer;">
                <img src="${imgSrc}" alt="${sp.ten_sp}">
                <h4>${sp.ten_sp}</h4>
                <p class="price">${Number(sp.gia).toLocaleString()}₫</p>
            </div>
        `;
        grid.innerHTML += card;
    });

    // Gắn sự kiện click
    setTimeout(() => {
        document.querySelectorAll(".card").forEach(card => {
            card.addEventListener("click", () => openProductDetail(card.dataset.id));
        });
    }, 0);
}

function renderPagination() {
    let pag = document.querySelector(".pagination");
    if (!pag) return;

    let totalPage = Math.ceil(productList.length / itemsPerPage);
    pag.innerHTML = "";

    // Prev
    pag.innerHTML += `<button onclick="changePage(${currentPage - 1})" ${currentPage == 1 ? "disabled" : ""}>&lt;</button>`;

    // Pages
    for (let i = 1; i <= totalPage; i++) {
        pag.innerHTML += `
            <button class="page ${i == currentPage ? "active" : ""}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }

    // Next
    pag.innerHTML += `<button onclick="changePage(${currentPage + 1})" ${currentPage == totalPage ? "disabled" : ""}>&gt;</button>`;
}

function changePage(page) {
    // (Giữ nguyên code đổi trang cũ)
    let totalPage = Math.ceil(productList.length / itemsPerPage);
    if (page < 1 || page > totalPage) return;
    currentPage = page;
    renderProducts();
    renderPagination();
}

async function openProductDetail(id) {
    let res = await fetch("product/get_product_by_id.php?id=" + id);
    let data = await res.json();
    if (data.success) {
        let sp = data.data;
        let imgSrc = sp.img_url ? sp.img_url : "uploads/" + sp.hinh_anh;

        // Điền thông tin
        document.getElementById("ctsp_img").src = imgSrc;
        document.getElementById("ctsp_ten").innerText = sp.ten_sp;
        document.getElementById("ctsp_loai").innerText = sp.loai_sp;
        document.getElementById("ctsp_gt").innerText = sp.gt_sp;
        document.getElementById("ctsp_sl").innerText = sp.soluong;
        document.getElementById("ctsp_gia").innerText = Number(sp.gia).toLocaleString() + "₫";
        document.getElementById("ctsp_mota").innerText = sp.mo_ta;
        document.getElementById("ctsp_ngay").innerText = sp.ngay_dang;

        // Gán ID cho nút Sửa/Xóa để file dialog_script.js dùng
        // Kiểm tra null để tránh lỗi nếu dialog chưa load kịp (hiếm khi xảy ra)
        if(document.getElementById("btnSuaSP")) document.getElementById("btnSuaSP").dataset.id = id;
        if(document.getElementById("btnXoaSP")) document.getElementById("btnXoaSP").dataset.id = id;

        document.getElementById("modalCTSP").showModal();
    }
}

// ============================================================
//  SEARCH PRODUCT
// ============================================================
document.getElementById("searchInput")?.addEventListener("input", function () {
    const keyword = this.value.toLowerCase().trim();

    filteredList = productList.filter(sp =>
        sp.ten_sp.toLowerCase().includes(keyword) ||
        sp.loai_sp.toLowerCase().includes(keyword)
    );

    currentPage = 1;
    renderProducts();
    renderPagination();
});
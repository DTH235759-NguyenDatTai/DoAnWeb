// ============================================================
// KHAI BÁO BIẾN TOÀN CỤC
// ============================================================
let currentPage = 1;
let itemsPerPage = 9;
let productList = [];      // Danh sách gốc từ server
let filteredList = [];     // Danh sách đang hiển thị (đã lọc)
let currentGender = 'all'; // Trạng thái giới tính hiện tại

// ============================================================
// KHI TRANG WEB TẢI XONG
// ============================================================
window.onload = () => {
    // 1. Tải sản phẩm
    loadProducts();

    // 2. Cập nhật số lượng giỏ hàng từ LocalStorage
    updateCartCount();

    // 3. Kiểm tra thông báo lần đầu
    loadNotifications();

    // 4. Cài đặt tự động kiểm tra thông báo mỗi 3 giây
    setInterval(() => {
        loadNotifications();
    }, 3000);

    // 5. Gắn sự kiện cho nút "Áp dụng" ở Sidebar (nếu chưa có trong HTML)
    const applyBtn = document.querySelector('.sidebar-left .apply-btn');
    if (applyBtn) {
        applyBtn.onclick = applySidebarFilters;
    }

    // 6. Gắn sự kiện cho nút "Xóa tất cả" ở Sidebar
    const clearBtn = document.querySelector('.sidebar-left .clear');
    if (clearBtn) {
        clearBtn.onclick = (e) => {
            e.preventDefault();
            // Bỏ tick tất cả checkbox
            document.querySelectorAll('.sidebar-left input[type="checkbox"]').forEach(el => el.checked = false);
            // Reset giới tính về 'all' nếu muốn (hoặc giữ nguyên tùy ý)
            // currentGender = 'all'; 
            applySidebarFilters();
        };
    }

    // 7. Khoi tao chatbot noi
    initChatbot();
};

// ============================================================
// 1. TẢI VÀ HIỂN THỊ SẢN PHẨM
// ============================================================
async function loadProducts() {
    try {
        let res = await fetch("../admin/product/get_products.php");
        let data = await res.json();

        if (!data.success) {
            console.log("Lỗi server: " + data.message);
            return;
        }

        productList = data.data || [];
        filteredList = productList;

        // Mặc định render trang đầu
        renderProducts();
        renderPagination();
    } catch (err) {
        console.error("Không thể load sản phẩm:", err);
    }
}

// Render lưới sản phẩm
function renderProducts() {
    let grid = document.querySelector(".product-grid");
    if (!grid) return;
    
    grid.innerHTML = "";

    if (filteredList.length === 0) {
        grid.innerHTML = "<h3 style='grid-column: 1/-1; text-align: center; color: #777;'>Không tìm thấy sản phẩm phù hợp.</h3>";
        return;
    }

    let start = (currentPage - 1) * itemsPerPage;
    let end = start + itemsPerPage;
    let items = filteredList.slice(start, end);

    items.forEach(sp => {
        // Xử lý đường dẫn ảnh
        let imgSrc = sp.hinh_anh ? `../admin/uploads/${sp.hinh_anh}` : 'https://via.placeholder.com/300';

        let card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = sp.id;
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <img src="${imgSrc}" alt="${sp.ten_sp}" onerror="this.src='https://via.placeholder.com/300'">
            <h4>${sp.ten_sp}</h4>
            <p class="price">${Number(sp.gia).toLocaleString()}₫</p>
        `;
        
        // Gắn sự kiện click mở modal
        card.addEventListener('click', () => openProductDetail(sp.id));
        
        grid.appendChild(card);
    });
}

// ============================================================
// 2. BỘ LỌC (GIỚI TÍNH + SIDEBAR)
// ============================================================

// Hàm xử lý khi bấm menu Nam / Nữ / Unisex
function filterGender(gender, e) {
    if (e) {
        e.preventDefault();
        // Cập nhật UI active cho menu
        document.querySelectorAll('.main-nav a').forEach(el => el.classList.remove('active'));
        e.target.classList.add('active');
    }

    currentGender = gender; // Lưu trạng thái
    applySidebarFilters();  // Gọi hàm lọc tổng hợp
}

// Hàm lọc tổng hợp (Kết hợp Gender + Danh mục + Giá)
function applySidebarFilters() {
    // 1. Lấy các checkbox danh mục đang được tick
    // (Code này tự động lấy text trong thẻ label nếu HTML chưa có value)
    const cateInputs = document.querySelectorAll('.filter-card:nth-of-type(1) input[type="checkbox"]:checked');
    const checkedCates = Array.from(cateInputs).map(input => {
        return input.value || input.parentElement.innerText.trim().toLowerCase();
    });

    // 2. Lấy các checkbox giá đang được tick
    const priceInputs = document.querySelectorAll('.filter-card:nth-of-type(2) input[type="checkbox"]:checked');
    const checkedPricesText = Array.from(priceInputs).map(input => {
        return input.value || input.parentElement.innerText.trim();
    });

    // 3. Lọc dữ liệu
    filteredList = productList.filter(sp => {
        // --- A. Lọc theo Giới tính ---
        let passGender = true;
        if (currentGender !== 'all') {
            if (!sp.gt_sp || sp.gt_sp.trim().toLowerCase() !== currentGender.toLowerCase()) {
                passGender = false;
            }
        }

        // --- B. Lọc theo Danh mục ---
        let passCate = true;
        if (checkedCates.length > 0) {
            let loaiSP = sp.loai_sp ? sp.loai_sp.toLowerCase() : "";
            // Kiểm tra xem tên loại sản phẩm có chứa từ khóa nào không (ví dụ: 'áo' trong 'áo thun')
            let match = checkedCates.some(cate => loaiSP.includes(cate.toLowerCase()));
            if (!match) passCate = false;
        }

        // --- C. Lọc theo Giá ---
        let passPrice = true;
        if (checkedPricesText.length > 0) {
            let price = Number(sp.gia);
            let matchPrice = false;
            
            // Logic so sánh dựa trên text (hỗ trợ cả value cũ và text label)
            checkedPricesText.forEach(text => {
                text = text.toLowerCase();
                if ((text.includes('dưới 50') || text === 'under_50') && price < 50000) matchPrice = true;
                if ((text.includes('50k đến 100k') || text === '50_100') && price >= 50000 && price <= 100000) matchPrice = true;
                if ((text.includes('trên 100') || text === 'above_100') && price > 100000) matchPrice = true;
            });

            if (!matchPrice) passPrice = false;
        }

        return passGender && passCate && passPrice;
    });

    // Reset về trang 1 và render lại
    currentPage = 1;
    renderProducts();
    renderPagination();
    
    console.log(`Kết quả lọc: ${filteredList.length} sản phẩm.`);
}

// ============================================================
// 3. PHÂN TRANG
// ============================================================
function renderPagination() {
    let totalPage = Math.ceil(filteredList.length / itemsPerPage);
    let pag = document.querySelector(".pagination");
    if(!pag) return;

    pag.innerHTML = "";
    if (totalPage <= 1) return;

    // Nút Prev
    let btnPrev = document.createElement('button');
    btnPrev.innerHTML = "&lt;";
    btnPrev.disabled = currentPage === 1;
    btnPrev.onclick = () => changePage(currentPage - 1);
    pag.appendChild(btnPrev);

    // Các nút số
    for (let i = 1; i <= totalPage; i++) {
        let btn = document.createElement('button');
        btn.className = `page ${i === currentPage ? "active" : ""}`;
        btn.innerText = i;
        btn.onclick = () => changePage(i);
        pag.appendChild(btn);
    }

    // Nút Next
    let btnNext = document.createElement('button');
    btnNext.innerHTML = "&gt;";
    btnNext.disabled = currentPage === totalPage;
    btnNext.onclick = () => changePage(currentPage + 1);
    pag.appendChild(btnNext);
}

function changePage(page) {
    let totalPage = Math.ceil(filteredList.length / itemsPerPage);
    if (page < 1 || page > totalPage) return;
    currentPage = page;
    renderProducts();
    renderPagination();
}

// ============================================================
// 4. CHI TIẾT SẢN PHẨM (MODAL)
// ============================================================
async function openProductDetail(id) {
    try {
        let res = await fetch("../admin/product/get_product_by_id.php?id=" + id);
        let data = await res.json();

        if (!data.success) {
            alert("Không thể lấy thông tin sản phẩm.");
            return;
        }

        let sp = data.data;
        
        // Xử lý đường dẫn ảnh cho Modal
        let imgSrc = sp.img_url ? sp.img_url : "../admin/uploads/" + sp.hinh_anh;
        if (imgSrc.startsWith("uploads/")) imgSrc = "../admin/" + imgSrc;

        document.getElementById("ctsp_img").src = imgSrc;
        document.getElementById("ctsp_ten").innerText = sp.ten_sp;
        document.getElementById("ctsp_loai").innerText = sp.loai_sp;
        document.getElementById("ctsp_gt").innerText = sp.gt_sp;
        document.getElementById("ctsp_sl").innerText = sp.soluong;
        document.getElementById("ctsp_gia").innerText = Number(sp.gia).toLocaleString() + "₫";
        document.getElementById("ctsp_mota").innerText = sp.mo_ta || "Đang cập nhật...";
        document.getElementById("ctsp_ngay").innerText = sp.ngay_dang;

        // Gán ID vào nút thêm giỏ hàng
        const btnAdd = document.getElementById("btnThemVaoGio");
        if(btnAdd) btnAdd.dataset.id = id;

        document.getElementById("modalCTSP").showModal();

    } catch (err) {
        console.error(err);
    }
}

// Đóng Modal chi tiết
const btnDongCTSP = document.getElementById("btnDongCTSP");
if(btnDongCTSP) {
    btnDongCTSP.onclick = () => document.getElementById("modalCTSP").close();
}

// ============================================================
// 5. GIỎ HÀNG
// ============================================================
const btnThemVaoGio = document.getElementById("btnThemVaoGio");
if (btnThemVaoGio) {
    btnThemVaoGio.onclick = (e) => {
        let id = e.target.dataset.id;
        if (!id) return;

        let cart = JSON.parse(localStorage.getItem("shopping_cart")) || [];
        let existingItem = cart.find(item => item.id == id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id: id, quantity: 1 });
        }

        localStorage.setItem("shopping_cart", JSON.stringify(cart));
        alert("Đã thêm vào giỏ hàng!");
        updateCartCount();
        document.getElementById("modalCTSP").close();
    };
}

function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem("shopping_cart")) || [];
    let totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    document.querySelectorAll(".cart-count").forEach(el => {
        el.innerText = totalQty;
    });
}

// ===============================
// XỬ LÝ THÔNG BÁO (ĐÃ SỬA LỖI)
// ===============================
const btnThongBao = document.getElementById("btnThongBao");
const modalThongBao = document.getElementById("modalThongBao");
const closeNotif = document.getElementById("closeNotif");
const notifList = document.getElementById("list-notif-content");
const notifBadge = document.getElementById("notif-badge");

// 1. Bấm chuông -> Mở modal, tắt chấm đỏ & Load dữ liệu để xem
if (btnThongBao) {
    btnThongBao.onclick = async () => {
        modalThongBao.showModal();
        if(notifBadge) notifBadge.style.display = "none"; // Tắt chấm đỏ
        
        // Gọi hàm load với tham số true (đánh dấu là đã xem)
        await loadNotifications(true);
    };
}

if (closeNotif) closeNotif.onclick = () => modalThongBao.close();

// Hàm tải thông báo
async function loadNotifications(isMarkingRead = false) {
    try {
        let res = await fetch("../admin/product/get_user_orders.php");
        let json = await res.json();

        if (!json.data) return;

        // --- LOGIC 1: Xử lý chấm đỏ ---
        // Đếm số đơn hàng đã có kết quả (Đã Giao hoặc Đã Hủy)
        let finishedOrders = json.data.filter(od => 
            od.trang_thai === 'da_giao' || od.trang_thai === 'da_huy'
        ).length;
        
        // Lấy số lượng đã xem lần trước trong bộ nhớ
        let lastSeenCount = localStorage.getItem('last_seen_orders_count') || 0;

        if (isMarkingRead) {
            // Nếu đang mở bảng xem -> Cập nhật lại bộ nhớ bằng số hiện tại
            localStorage.setItem('last_seen_orders_count', finishedOrders);
        } else {
            // Nếu đang chạy ngầm -> So sánh xem có đơn mới xong không
            if (finishedOrders > lastSeenCount) {
                if(notifBadge) notifBadge.style.display = "block";
            }
        }

        // --- LOGIC 2: Hiển thị danh sách (Chỉ render khi Modal đang mở) ---
        if (notifList && modalThongBao && modalThongBao.open) {
            notifList.innerHTML = "";
            if (json.data.length === 0) {
                notifList.innerHTML = "<li style='padding:20px; text-align:center; color:#777;'>Bạn chưa có đơn hàng nào.</li>";
                return;
            }

            json.data.forEach(order => {
                let msg = "", icon = "", color = "";

                // Xử lý text hiển thị cho từng trạng thái
                if (order.trang_thai === 'dang_xu_ly') {
                    msg = `Đơn hàng <b>#${order.id}</b> đang chờ xử lý.`;
                    icon = "hourglass_empty"; color = "orange";
                } else if (order.trang_thai === 'da_giao') {
                    msg = `Đơn hàng <b>#${order.id}</b> của bạn đã được <b>DUYỆT</b>!`;
                    icon = "check_circle"; color = "green";
                } else if (order.trang_thai === 'da_huy') {
                    msg = `Đơn hàng <b>#${order.id}</b> đã bị <b>HỦY</b>.`;
                    icon = "cancel"; color = "red";
                } else {
                    msg = `Đơn hàng <b>#${order.id}</b>: ${order.trang_thai}`;
                    icon = "info"; color = "gray";
                }

                let li = `
                    <li class="notif-item" style="display:flex; gap:10px; align-items:start; margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:8px;">
                        <span class="material-symbols-outlined" style="color:${color}; margin-top:2px;">${icon}</span>
                        <div>
                            <div style="font-size: 0.95rem;">${msg}</div>
                            <div style="font-size:0.85rem; color:#666; margin-top:4px;">Tổng: ${Number(order.tong_tien).toLocaleString()}₫</div>
                            <div class="notif-time" style="font-size:0.75rem; color:#999;">${order.ngay_dat}</div>
                        </div>
                    </li>
                `;
                notifList.innerHTML += li;
            });
        }
    } catch (err) {
        console.error("Lỗi fetch thông báo:", err);
    }
}

// Gọi ngay khi vào trang
updateCartCount();
loadNotifications();

// Kiểm tra thông báo mỗi 3 giây
setInterval(() => {
    loadNotifications();
}, 3000);

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

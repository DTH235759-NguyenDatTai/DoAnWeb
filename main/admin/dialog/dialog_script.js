// ------------------------------
// API Helper
// ------------------------------
async function apiGet(url) {
    try {
        const res = await fetch(url);
        return await res.json();
    } catch (err) {
        console.error("GET API Failed:", err);
        return { success: false };
    }
}

async function apiPost(url, body) {
    try {
        const res = await fetch(url, { method: "POST", body });
        return await res.json();
    } catch (err) {
        console.error("POST API Failed:", err);
        return { success: false };
    }
}

// ------------------------------
// DOM SELECTOR Helper
// ------------------------------
const $ = id => document.getElementById(id);

// ------------------------------
// MAIN INIT
// ------------------------------
function initDialogEvents() {
    console.log("Khởi tạo Dialog Events...");

    initAddProduct();
    initEditProduct();
    initDeleteProduct();
    initOrderManagement();
}

/* ============================================================
 * 1) THÊM SẢN PHẨM
 * ============================================================ */
function initAddProduct() {
    const modalAdd = $("modalQLSP");
    const btnOpen = $("btnQLSP");
    const btnClose = $("closeModal");
    const form = $("formSP");

    if (btnOpen) btnOpen.onclick = () => modalAdd.showModal();
    if (btnClose) btnClose.onclick = () => modalAdd.close();

    if (!form) return;

    form.onsubmit = async e => {
        e.preventDefault();

        const formData = new FormData(form);
        const imgFile = $("sp_img")?.files[0];

        if (imgFile) formData.set("hinh_anh", imgFile);

        const data = await apiPost("../admin/product/add_product.php", formData);

        alert(data.message);

        if (data.success) {
            form.reset();
            modalAdd.close();
            window.loadProducts?.();
        }
    };
}

/* ============================================================
 * 2) SỬA SẢN PHẨM
 * ============================================================ */
function initEditProduct() {
    const btnEdit = $("btnSuaSP");
    const modalDetail = $("modalCTSP");
    const modalEdit = $("modalSuaSP");
    const formEdit = $("formSuaSP");
    const btnCloseEdit = $("btnDongSua");
    const previewOld = $("edit_preview_old");

    if (btnEdit) {
        btnEdit.onclick = async e => {
            const id = e.target.dataset.id;
            const json = await apiGet("../admin/product/get_product_by_id.php?id=" + id);
            if (!json.success) return;

            const sp = json.data;

            // Fill fields
            $("edit_id").value = sp.id;
            $("edit_ten").value = sp.ten_sp;
            $("edit_loai").value = sp.loai_sp;
            $("edit_gt").value = sp.gt_sp;
            $("edit_gia").value = sp.gia;
            $("edit_sl").value = sp.soluong;
            $("edit_mota").value = sp.mo_ta;

            previewOld.src = sp.img_url || ("uploads/" + sp.hinh_anh);
            $("edit_img").value = "";

            modalDetail.close();
            modalEdit.showModal();
        };
    }

    if (formEdit) {
        formEdit.onsubmit = async e => {
            e.preventDefault();

            const formData = new FormData(formEdit);
            const imgFile = $("edit_img")?.files[0];

            if (imgFile) formData.append("hinh_anh", imgFile);

            const data = await apiPost("../admin/product/update_product.php", formData);

            alert(data.message);

            if (data.success) {
                modalEdit.close();
                window.loadProducts?.();
            }
        };
    }

    if (btnCloseEdit) btnCloseEdit.onclick = () => modalEdit.close();

    const inputImg = $("edit_img");
    if (inputImg) {
        inputImg.onchange = e => {
            const [file] = e.target.files;
            if (file) previewOld.src = URL.createObjectURL(file);
        };
    }
}

/* ============================================================
 * 3) XÓA SẢN PHẨM
 * ============================================================ */
function initDeleteProduct() {
    const btnDelete = $("btnXoaSP");
    const modalDetail = $("modalCTSP");

    if (!btnDelete) return;

    btnDelete.onclick = async e => {
        if (!confirm("Xóa sản phẩm này?")) return;

        const id = e.target.dataset.id;
        const body = new URLSearchParams({ id });

        const data = await apiPost("../admin/product/delete_product.php", body);

        alert(data.message);

        if (data.success) {
            modalDetail.close();
            window.loadProducts?.();
        }
    };
}

/* ============================================================
 * 4) QUẢN LÍ ĐƠN HÀNG
 * ============================================================ */
function initOrderManagement() {
    const modalOrder = $("modalDuyetDon");
    const btnOrder = $("btnQLDH");
    const btnOrderClose = $("btnDongDonHang");

    if (btnOrder) {
        btnOrder.onclick = () => {
            loadOrders();
            modalOrder.showModal();
        };
    }

    if (btnOrderClose) btnOrderClose.onclick = () => modalOrder.close();

    // ▶ GLOBAL để gọi từ HTML button
    window.updateStatus = async (id, status) => {
        if (!confirm("Bạn chắc chắn muốn thay đổi trạng thái?")) return;

        const formData = new FormData();
        formData.append("id", id);
        formData.append("status", status);

        const data = await apiPost("../admin/product/update_order.php", formData);

        if (data.success) loadOrders();
        else alert(data.message);
    };
}

/**
 * Tải danh sách đơn hàng (tách nhỏ cho sạch)
 */
async function loadOrders() {
    const json = await apiGet("../admin/product/get_orders.php");
    const tbody = $("order-list");

    tbody.innerHTML = "";

    if (!json.data) return;

    json.data.forEach(dh => tbody.innerHTML += renderOrderRow(dh));
}

/**
 * Renderer: Tạo 1 dòng đơn hàng
 */
function renderOrderRow(dh) {
    const formatMoney = n => Number(n).toLocaleString() + "₫";

    const statusMap = {
        "dang_xu_ly": `<span style="color:orange">Chờ xử lý</span>`,
        "da_giao": `<span style="color:green;font-weight:bold;">Đã duyệt</span>`,
        "huy": `<span style="color:red;">Đã hủy</span>`
    };

    const actionBtns = dh.trang_thai === "dang_xu_ly"
        ? `
            <button onclick="updateStatus(${dh.id}, 'da_giao')" class="btn-approve">Duyệt</button>
            <button onclick="updateStatus(${dh.id}, 'huy')" class="btn-cancel">Hủy</button>
        `
        : "";

    return `
        <tr>
            <td>#${dh.id}</td>
            <td>${dh.ten_khach}</td>
            <td>${formatMoney(dh.tong_tien)}</td>
            <td>${dh.ngay_dat}</td>
            <td>${statusMap[dh.trang_thai]}</td>
            <td>${actionBtns}</td>
        </tr>
    `;
}
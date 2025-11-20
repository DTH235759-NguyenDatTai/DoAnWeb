// ============================================================
// dialog_script.js - Xử lý sự kiện Modal (Thêm, Sửa, Xóa)
// ============================================================

function initDialogEvents() {
    console.log("Đang khởi tạo các sự kiện Dialog...");

    const modalQLSP = document.getElementById("modalQLSP");
    const modalCTSP = document.getElementById("modalCTSP");
    const modalSuaSP = document.getElementById("modalSuaSP");

    // --- 1. XỬ LÝ THÊM SẢN PHẨM ---
    const btnQLSP = document.getElementById("btnQLSP");
    const closeModal = document.getElementById("closeModal");
    const formSP = document.getElementById("formSP");

    if (btnQLSP) btnQLSP.onclick = () => modalQLSP.showModal();
    if (closeModal) closeModal.onclick = () => modalQLSP.close();

    if (formSP) {
        formSP.onsubmit = async (e) => {
            e.preventDefault();
            let formData = new FormData(formSP);

            let img = document.getElementById("sp_img").files[0];
            formData.set("hinh_anh", img); // Dùng set để ghi đè nếu trùng

            try {
                let res = await fetch("../admin/product/add_product.php", { method: "POST", body: formData });
                let data = await res.json();
                alert(data.message);
                if (data.success) {
                    formSP.reset();
                    modalQLSP.close();
                    if (typeof loadProducts === "function") loadProducts(); // Gọi hàm bên ad_script.js
                }
            } catch (err) { console.error(err); alert("Lỗi thêm sản phẩm!"); }
        };
    }

    // --- 2. XỬ LÝ SỬA SẢN PHẨM ---
    const btnSuaSP = document.getElementById("btnSuaSP");
    const formSuaSP = document.getElementById("formSuaSP");
    const btnDongSua = document.getElementById("btnDongSua");

    // Nút mở form sửa (Lấy data từ modal chi tiết chuyển sang)
    if (btnSuaSP) {
        btnSuaSP.onclick = async (e) => {
            let id = e.target.dataset.id;
            // Gọi API lấy chi tiết mới nhất
            let res = await fetch("../admin/product/get_product_by_id.php?id=" + id);
            let json = await res.json();
            if (json.success) {
                let sp = json.data;
                // Điền dữ liệu
                document.getElementById("edit_id").value = sp.id;
                document.getElementById("edit_ten").value = sp.ten_sp;
                document.getElementById("edit_loai").value = sp.loai_sp;
                document.getElementById("edit_gt").value = sp.gt_sp;
                document.getElementById("edit_gia").value = sp.gia;
                document.getElementById("edit_sl").value = sp.soluong;
                document.getElementById("edit_mota").value = sp.mo_ta;
                
                let imgSrc = sp.img_url ? sp.img_url : "uploads/" + sp.hinh_anh;
                document.getElementById("edit_preview_old").src = imgSrc;
                document.getElementById("edit_img").value = "";

                modalCTSP.close();
                modalSuaSP.showModal();
            }
        };
    }

    if (formSuaSP) {
        formSuaSP.onsubmit = async (e) => {
            e.preventDefault();
            let formData = new FormData(formSuaSP);
            
            // Append file ảnh nếu có
            let newImg = document.getElementById("edit_img").files[0];
            if (newImg) formData.append("hinh_anh", newImg);
            
            // Append các trường thủ công nếu FormData(form) không tự bắt được ID
            formData.set("id", document.getElementById("edit_id").value);
            formData.set("ten_sp", document.getElementById("edit_ten").value);
            // ... các trường khác nếu input có name="" đúng thì FormData tự lấy

            try {
                let res = await fetch("../admin/product/update_product.php", { method: "POST", body: formData });
                let data = await res.json();
                alert(data.message);
                if (data.success) {
                    modalSuaSP.close();
                    if (typeof loadProducts === "function") loadProducts();
                }
            } catch (err) { console.error(err); }
        };
    }

    if (btnDongSua) btnDongSua.onclick = () => modalSuaSP.close();

    // Xem trước ảnh khi sửa
    const editImgInput = document.getElementById("edit_img");
    if (editImgInput) {
        editImgInput.onchange = (e) => {
            const [file] = e.target.files;
            if (file) document.getElementById("edit_preview_old").src = URL.createObjectURL(file);
        };
    }

    // --- 3. XỬ LÝ XÓA & ĐÓNG CHI TIẾT ---
    const btnXoaSP = document.getElementById("btnXoaSP");
    const btnDongCTSP = document.getElementById("btnDongCTSP");

    if (btnXoaSP) {
        btnXoaSP.onclick = async (e) => {
            if (!confirm("Xóa sản phẩm này?")) return;
            let id = e.target.dataset.id;
            let res = await fetch("../admin/product/delete_product.php", { method: "POST", body: new URLSearchParams({ id }) });
            let data = await res.json();
            alert(data.message);
            if (data.success) {
                modalCTSP.close();
                if (typeof loadProducts === "function") loadProducts();
            }
        };
    }

// --- 4. XỬ LÝ DUYỆT ĐƠN HÀNG (Thêm mới vào dialog_script.js) ---
    const modalDuyetDon = document.getElementById("modalDuyetDon");
    const btnQLDonHang = document.querySelector("a[href='#'][onclick*='modalDuyetDon']");
    
    // Bạn cần sửa file admin.html: Tìm thẻ <a>Quản Lí Đơn Hàng</a> và thêm id="btnQLDH"
    const btnQLDH = document.getElementById("btnQLDH"); 
    const btnDongDonHang = document.getElementById("btnDongDonHang");

    if (btnQLDH) {
        btnQLDH.onclick = (e) => {
            e.preventDefault();
            loadOrders(); // Gọi hàm load dữ liệu
            modalDuyetDon.showModal();
        };
    }

    if (btnDongDonHang) btnDongDonHang.onclick = () => modalDuyetDon.close();

    // Hàm load danh sách đơn hàng
    async function loadOrders() {
        let res = await fetch("../admin/product/get_orders.php");
        let json = await res.json();
        let tbody = document.getElementById("order-list");
        tbody.innerHTML = "";

        json.data.forEach(dh => {
            let statusText = "";
            let actionBtns = "";

            if (dh.trang_thai === 'dang_xu_ly') {
                statusText = '<span style="color:orange">Chờ xử lý</span>';
                actionBtns = `
                    <button onclick="updateStatus(${dh.id}, 'da_giao')" style="background:green; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px;">Duyệt</button>
                    <button onclick="updateStatus(${dh.id}, 'huy')" style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px;">Hủy</button>
                `;
            } else if (dh.trang_thai === 'da_giao') {
                statusText = '<span style="color:green; font-weight:bold;">Đã duyệt</span>';
            } else {
                statusText = '<span style="color:red;">Đã hủy</span>';
            }

            let row = `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">#${dh.id}</td>
                    <td style="padding: 10px;">${dh.ten_khach}</td>
                    <td style="padding: 10px;">${Number(dh.tong_tien).toLocaleString()}₫</td>
                    <td style="padding: 10px;">${dh.ngay_dat}</td>
                    <td style="padding: 10px;">${statusText}</td>
                    <td style="padding: 10px;">${actionBtns}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }

    // Hàm cập nhật trạng thái (để global để gọi được từ HTML string)
    window.updateStatus = async (id, status) => {
        if(!confirm("Bạn chắc chắn muốn thay đổi trạng thái?")) return;
        
        let formData = new FormData();
        formData.append('id', id);
        formData.append('status', status);

        let res = await fetch("../admin/product/update_order.php", { method: "POST", body: formData });
        let data = await res.json();
        
        if(data.success) {
            loadOrders(); // Load lại bảng
        } else {
            alert(data.message);
        }
    };    

    if (btnDongCTSP) btnDongCTSP.onclick = () => modalCTSP.close();
}
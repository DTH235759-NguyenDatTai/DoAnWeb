// cart_script.js
// =========================================
// File quản lý toàn bộ logic hiển thị giỏ hàng
// =========================================

// Hàm lấy giỏ hàng từ localStorage
function getCart() {
    return JSON.parse(localStorage.getItem("shopping_cart")) || [];
}

// Hàm xử lý đường dẫn ảnh sản phẩm (tối ưu và tái sử dụng)
function resolveImagePath(sp) {
    let imgSrc = sp.img_url ? sp.img_url : "../../admin/uploads/" + sp.hinh_anh;
    if (imgSrc.startsWith("uploads/")) imgSrc = "../../admin/" + imgSrc;
    return imgSrc;
}

// =========================================
// LOAD GIỎ HÀNG
// =========================================
async function loadCart() {
    const cart = getCart();
    const cartListContainer = document.getElementById("cart-list");

    // Nếu giỏ hàng trống thì kết thúc luôn
    if (cart.length === 0) {
        cartListContainer.innerHTML = `
            <p style='text-align:center; margin-top:20px;'>Giỏ hàng của bạn đang trống.</p>
        `;
        updateSummary(0);
        updateCartBadge(cart);
        return;
    }

    // Gọi API cho tất cả sản phẩm song song
    const fetchPromises = cart.map(item =>
        fetch(`../../admin/product/get_product_by_id.php?id=${item.id}`)
            .then(res => res.json())
            .catch(err => ({ success: false, error: err }))
    );

    // Chờ tất cả API hoàn thành
    const results = await Promise.all(fetchPromises);

    let html = "";
    let totalAmount = 0;

    // Xử lý từng kết quả trả về
    results.forEach((json, index) => {
        if (!json.success) return;

        const item = cart[index];
        const sp = json.data;

        const itemTotal = sp.gia * item.quantity;
        totalAmount += itemTotal;

        const imgSrc = resolveImagePath(sp);

        // Build HTML nhưng không đẩy vào DOM ngay → nhanh hơn
        html += `
            <div class="cart-item">
                <img src="${imgSrc}" alt="${sp.ten_sp}" class="item-img">

                <div class="item-info">
                    <h4>${sp.ten_sp}</h4>
                    <p class="item-variant">Loại: ${sp.loai_sp}</p>
                    <p class="item-price">${Number(sp.gia).toLocaleString()}₫</p>
                </div>

                <div class="item-actions">
                    <div class="qty-control">
                        <button onclick="updateQuantity(${sp.id}, -1)">-</button>
                        <input type="text" value="${item.quantity}" readonly>
                        <button onclick="updateQuantity(${sp.id}, 1)">+</button>
                    </div>

                    <button class="btn-delete" onclick="removeItem(${sp.id})">
                        <span class="material-symbols-outlined">delete</span> Xóa
                    </button>
                </div>
            </div>
        `;
    });

    // Chỉ render 1 lần → nhanh!
    cartListContainer.innerHTML = html;

    // Cập nhật tổng tiền và icon giỏ
    updateSummary(totalAmount);
    updateCartBadge(cart);
}

// =========================================
// TĂNG / GIẢM SỐ LƯỢNG
// =========================================
function updateQuantity(id, change) {
    let cart = getCart();
    let item = cart.find(i => i.id == id);

    if (item) {
        item.quantity += change;

        // Nếu giảm về 0 thì xóa sản phẩm
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id != id);
        }
    }

    localStorage.setItem("shopping_cart", JSON.stringify(cart));
    loadCart(); // load lại UI
}

// =========================================
// XÓA SẢN PHẨM
// =========================================
function removeItem(id) {
    if (!confirm("Bạn muốn xóa sản phẩm này?")) return;

    let cart = getCart();
    cart = cart.filter(i => i.id != id);

    localStorage.setItem("shopping_cart", JSON.stringify(cart));
    loadCart();
}

// =========================================
// CẬP NHẬT BẢNG TÓM TẮT
// =========================================
function updateSummary(subtotal) {
    let shipping = subtotal > 0 ? 30000 : 0;
    if (subtotal >= 500000) shipping = 0; // freeship

    const total = subtotal + shipping;

    const domMap = {
        "summary-subtotal": subtotal.toLocaleString() + "₫",
        "summary-shipping": shipping === 0 ? "Miễn phí" : shipping.toLocaleString() + "₫",
        "summary-total": total.toLocaleString() + "₫"
    };

    Object.keys(domMap).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = domMap[id];
    });
}

// =========================================
// CẬP NHẬT SỐ SẢN PHẨM TRÊN ICON GIỎ
// =========================================
function updateCartBadge(cart) {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll(".cart-count").forEach(el => el.innerText = totalQty);
}

// =========================================
// CHECKOUT
// =========================================
let btnCheckout = document.querySelector(".btn-checkout");

if (btnCheckout) {
    btnCheckout.onclick = async () => {
        let cart = getCart();

        if (cart.length === 0) {
            alert("Giỏ hàng trống!");
            return;
        }

        if (!confirm("Bạn có chắc chắn muốn đặt hàng?")) return;

        try {
            let res = await fetch("../../admin/product/checkout.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cart: cart, user_id: 1 })
            });

            let data = await res.json();

            if (data.success) {
                alert("Đặt hàng thành công! Mã đơn: " + data.order_id);
                localStorage.removeItem("shopping_cart");
                location.reload();
            } else {
                alert("Lỗi: " + data.message);
            }
        } catch (err) {
            console.error("Lỗi thanh toán:", err);
            alert("Có lỗi khi kết nối server.");
        }
    };
}

// Chạy khi trang load xong
window.onload = () => {
    loadCart();
};

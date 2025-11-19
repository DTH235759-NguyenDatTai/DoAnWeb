// ------------------------------
// STORAGE HELPERS
// ------------------------------
function getCart() {
    return JSON.parse(localStorage.getItem("shopping_cart")) || [];
}

function saveCart(cart) {
    localStorage.setItem("shopping_cart", JSON.stringify(cart));
}

// ------------------------------
// PATH HELPERS
// ------------------------------
function resolveImagePath(sp) {
    // Ưu tiên img_url (đã được API trả về)
    if (sp.img_url) return "../../admin/" + sp.img_url;

    // Fallback từ cơ sở dữ liệu
    return "../../admin/uploads/" + sp.hinh_anh;
}

// ------------------------------
// LOAD CART
// ------------------------------
async function loadCart() {
    const cart = getCart();
    const cartListContainer = document.getElementById("cart-list");

    if (cart.length === 0) {
        cartListContainer.innerHTML = "<p style='text-align:center; margin-top:20px;'>Giỏ hàng trống.</p>";
        updateSummary(0);
        updateCartBadge(cart);
        return;
    }

    // Fetch song song toàn bộ sản phẩm (tối ưu)
    const requests = cart.map(item => 
        fetch(`../../admin/product/get_product_by_id.php?id=${item.id}`)
            .then(r => r.json())
            .catch(() => ({ success: false }))
    );

    const results = await Promise.all(requests);

    let html = "";
    let totalAmount = 0;

    results.forEach((res, i) => {
        if (!res.success) return;
        const item = cart[i];
        const sp = res.data;

        const imgSrc = resolveImagePath(sp);
        const subtotal = sp.gia * item.quantity;
        totalAmount += subtotal;

        html += `
            <div class="cart-item">
                <img src="${imgSrc}" alt="${sp.ten_sp}" class="item-img">

                <div class="item-info">
                    <h4>${sp.ten_sp}</h4>
                    <p>Loại: ${sp.loai_sp}</p>
                    <p class="item-price">${Number(sp.gia).toLocaleString()}₫</p>
                </div>

                <div class="item-actions">
                    <div class="qty-control">
                        <button onclick="changeQty(${sp.id}, -1)">-</button>
                        <input type="text" value="${item.quantity}" readonly>
                        <button onclick="changeQty(${sp.id}, 1)">+</button>
                    </div>

                    <button class="btn-delete" onclick="removeItem(${sp.id})">
                        <span class="material-symbols-outlined">delete</span> Xóa
                    </button>
                </div>
            </div>
        `;
    });

    cartListContainer.innerHTML = html;

    updateSummary(totalAmount);
    updateCartBadge(cart);
}

// ------------------------------
// UPDATE QTY
// ------------------------------
function changeQty(id, change) {
    let cart = getCart();
    let item = cart.find(i => i.id === id);

    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id);
    }

    saveCart(cart);
    loadCart();
}

// ------------------------------
// REMOVE ITEM
// ------------------------------
function removeItem(id) {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    let cart = getCart().filter(i => i.id !== id);
    saveCart(cart);
    loadCart();
}

// ------------------------------
// SUMMARY
// ------------------------------
function updateSummary(subtotal) {
    const shipping = subtotal >= 500000 ? 0 : (subtotal > 0 ? 30000 : 0);
    const total = subtotal + shipping;

    const map = {
        "summary-subtotal": subtotal.toLocaleString() + "₫",
        "summary-shipping": shipping === 0 ? "Miễn phí" : shipping.toLocaleString() + "₫",
        "summary-total": total.toLocaleString() + "₫"
    };

    for (let id in map) {
        let el = document.getElementById(id);
        if (el) el.innerText = map[id];
    }
}

// ------------------------------
// UPDATE CART ICON
// ------------------------------
function updateCartBadge(cart) {
    const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll(".cart-count").forEach(el => el.innerText = quantity);
}

// ------------------------------
// CHECKOUT
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const btnCheckout = document.querySelector(".btn-checkout");

    if (!btnCheckout) return;

    btnCheckout.onclick = async () => {
        const cart = getCart();

        if (cart.length === 0) return alert("Giỏ hàng trống!");
        if (!confirm("Bạn chắc chắn muốn đặt hàng?")) return;

        try {
            const res = await fetch("../../admin/product/checkout.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cart })
            });

            const data = await res.json();

            if (data.success) {
                alert("Đặt hàng thành công! Mã đơn: " + data.order_id);
                localStorage.removeItem("shopping_cart");
                location.reload();
            } else {
                alert("Lỗi: " + data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Không thể kết nối đến server!");
        }
    };

    loadCart();
});
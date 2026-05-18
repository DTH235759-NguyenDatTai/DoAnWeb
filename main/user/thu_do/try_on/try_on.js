function updateModel() {

    const gender =
        document.getElementById("gender").value;

    const height =
        parseInt(document.getElementById("height").value);

    const weight =
        parseInt(document.getElementById("weight").value);

    const model =
        document.getElementById("model");

    const modelBox =
        document.getElementById("modelBox");

    model.src =`../try_on_images/${gender}.png`;

    let scaleHeight = height / 170;
    let scaleWeight = weight / 60;

    modelBox.style.transform =
        `scale(${scaleWeight}, ${scaleHeight})`;

    modelBox.style.transformOrigin =
        "top center";
}

function tryClothes(type, imagePath) {

    type = type.toLowerCase();

    if (type.includes("áo")) {

        document.getElementById("shirtLayer").src =
            imagePath;
    }

    else if (
        type.includes("quần") ||
        type.includes("váy")
    ) {

        document.getElementById("pantsLayer").src =
            imagePath;
    }

    else if (type.includes("giày")) {

        document.getElementById("shoesLayer").src =
            imagePath;
    }
}

function removeClothes() {

    document.getElementById("shirtLayer").src = "";
    document.getElementById("pantsLayer").src = "";
    document.getElementById("shoesLayer").src = "";
}

async function loadTryOnProducts() {

    const cart =
        JSON.parse(localStorage.getItem("shopping_cart")) || [];

    const container =
        document.getElementById("tryon-products");

    if (cart.length === 0) {

        container.innerHTML =
            "<p>Giỏ hàng trống.</p>";

        return;
    }

    let html = "";

    for (const item of cart) {

        try {

            const res = await fetch(
                `../../../admin/product/get_product_by_id.php?id=${item.id}`
            );

            const json = await res.json();

            if (!json.success) continue;

            const sp = json.data;

            const loai =
                sp.loai_sp.toLowerCase();

            if (
                !loai.includes("áo") &&
                !loai.includes("quần") &&
                !loai.includes("váy") &&
                !loai.includes("giày")
            ) {
                continue;
            }

            let imgSrc =
                sp.tryon_image
                ? "../../admin/uploads/" + sp.tryon_image
                : "../../admin/uploads/" + sp.hinh_anh;

            if (imgSrc.startsWith("uploads/")) {

                imgSrc =
                    "../../admin/" + imgSrc;
            }

            html += `
                <div class="try-item">

                    <img src="${imgSrc}">

                    <div>

                        <h4>${sp.ten_sp}</h4>

                        <p>${sp.loai_sp}</p>

                        <button onclick="
                            tryClothes(
                                '${loai}',
                                '${imgSrc}'
                            )
                        ">
                            Thử ngay
                        </button>

                    </div>

                </div>
            `;

        } catch (error) {

            console.error(
                "Lỗi lấy sản phẩm:",
                error
            );
        }
    }

    if (html === "") {

        container.innerHTML =
            "<p>Không có sản phẩm thử đồ.</p>";
    }

    else {

        container.innerHTML = html;
    }
}

window.onload = () => {

    loadTryOnProducts();
};
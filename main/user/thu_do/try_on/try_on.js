const mainPathIndex = location.pathname.indexOf("/main/");

const appBase =
    mainPathIndex >= 0
        ? `${location.origin}${location.pathname.slice(0, mainPathIndex + 5)}`
        : `${location.origin}/DoAnWeb/main`;

function appUrl(path) {
    return `${appBase}/${path.replace(/^\/+/, "")}`;
}

function updateModel() {
    const gender = document.getElementById("gender").value;
    const height = parseInt(document.getElementById("height").value, 10) || 170;
    const weight = parseInt(document.getElementById("weight").value, 10) || 60;

    const model = document.getElementById("model");

    model.src = appUrl(`user/thu_do/try_on_images/${gender}.png`);

    updateBodySize(height, weight);
}

function updateBodySize(height, weight) {
    const model = document.getElementById("model");

    const heightScale = height / 170;
    const widthScale = weight / 60;

    model.style.transform =
        `scale(${widthScale}, ${heightScale})`;

    model.style.transformOrigin =
        "top center";

    updateWornClothesScale();
}

function getBodyScale() {
    const height = parseInt(document.getElementById("height").value, 10) || 170;
    const weight = parseInt(document.getElementById("weight").value, 10) || 60;

    return {
        heightScale: height / 170,
        widthScale: weight / 60
    };
}

const CLOTH_CONFIG = {
    shirt: {
        layerId: "shirtLayer",
        top: 120,
        left: 58,
        width: 205,
        height: 190,
        zIndex: 4
    },

    pants: {
        layerId: "pantsLayer",
        top: 290,
        left: 66,
        width: 190,
        height: 260,
        zIndex: 3
    },

    shoes: {
        layerId: "shoesLayer",
        top: 555,
        left: 78,
        width: 165,
        height: 95,
        zIndex: 5
    }
};

const wornClothes = {
    shirt: null,
    pants: null,
    shoes: null
};

function getClothType(type) {
    const normalizedType = normalizeText(type);

    if (normalizedType.includes("ao")) {
        return "shirt";
    }

    if (
        normalizedType.includes("quan") ||
        normalizedType.includes("vay")
    ) {
        return "pants";
    }

    if (normalizedType.includes("giay")) {
        return "shoes";
    }

    return null;
}

function tryClothes(type, imagePath) {
    const clothType = getClothType(type);

    if (!clothType) {
        alert("Sản phẩm này chưa hỗ trợ thử đồ.");
        return;
    }

    wornClothes[clothType] = imagePath;

    clearAiResult();
    applyClothLayer(clothType, imagePath);
}

function applyClothLayer(clothType, imagePath) {
    const config = CLOTH_CONFIG[clothType];

    if (!config) return;

    const layer = document.getElementById(config.layerId);
    const scale = getBodyScale();

    layer.src = imagePath;

    layer.style.top = config.top + "px";
    layer.style.left = config.left + "px";
    layer.style.width =
        config.width * scale.widthScale + "px";
    layer.style.height =
        config.height * scale.heightScale + "px";
    layer.style.zIndex = config.zIndex;
}

function updateWornClothesScale() {
    Object.keys(wornClothes).forEach(type => {
        if (wornClothes[type]) {
            applyClothLayer(type, wornClothes[type]);
        }
    });
}

function removeClothes() {
    wornClothes.shirt = null;
    wornClothes.pants = null;
    wornClothes.shoes = null;

    document.getElementById("shirtLayer").removeAttribute("src");
    document.getElementById("pantsLayer").removeAttribute("src");
    document.getElementById("shoesLayer").removeAttribute("src");

    clearAiResult();
}

function getSelectedGarments() {
    return Object.keys(wornClothes)
        .filter(type => wornClothes[type])
        .map(type => ({
            type,
            imageUrl: wornClothes[type]
        }));
}

function setAiStatus(message, isError = false) {
    const status = document.getElementById("aiStatus");

    if (!status) return;

    status.textContent = message || "";
    status.classList.toggle("is-error", isError);
}

function clearAiResult() {
    const resultLayer = document.getElementById("aiResultLayer");

    if (resultLayer) {
        resultLayer.removeAttribute("src");
        resultLayer.classList.remove("is-visible");
    }

    setAiStatus("");
}

async function renderAiTryOn() {
    const garments = getSelectedGarments();

    if (!garments.length) {
        setAiStatus("Hay chon it nhat mot san pham de render AI.", true);
        return;
    }

    const gender = document.getElementById("gender").value;
    const height = parseInt(document.getElementById("height").value, 10) || 170;
    const weight = parseInt(document.getElementById("weight").value, 10) || 60;

    const payload = {
        gender,
        height,
        weight,
        modelImageUrl: appUrl(`user/thu_do/try_on_images/${gender}.png`),
        garments
    };

    setAiStatus("Dang tao anh AI...");

    try {
        const response = await fetch(appUrl("user/thu_do/try_on/ai_try_on.php"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Khong the render AI.");
        }

        const resultLayer = document.getElementById("aiResultLayer");

        resultLayer.src = result.imageUrl;
        resultLayer.classList.add("is-visible");

        setAiStatus("Da render xong anh AI.");
    } catch (error) {
        console.error("AI try-on error:", error);
        setAiStatus(error.message || "Render AI that bai.", true);
    }
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

    const fragment =
        document.createDocumentFragment();

    for (const item of cart) {
        try {
            const res = await fetch(
                appUrl(`admin/product/get_product_by_id.php?id=${item.id}`)
            );

            const json = await res.json();

            if (!json.success) continue;

            const sp = json.data;

            const loai =
                sp.loai_sp || "";

            const normalizedLoai =
                normalizeText(loai);

            if (
                !normalizedLoai.includes("ao") &&
                !normalizedLoai.includes("quan") &&
                !normalizedLoai.includes("vay") &&
                !normalizedLoai.includes("giay")
            ) {
                continue;
            }

            const imgSrc =
                buildUploadUrl(sp.tryon_image || sp.hinh_anh);

            fragment.appendChild(
                createTryOnItem(sp, loai, imgSrc)
            );

        } catch (error) {
            console.error("Lỗi lấy sản phẩm:", error);
        }
    }

    container.innerHTML = "";

    if (!fragment.childNodes.length) {
        container.innerHTML =
            "<p>Không có sản phẩm thử đồ.</p>";
        return;
    }

    container.appendChild(fragment);
}

function createTryOnItem(sp, type, imagePath) {
    const item =
        document.createElement("div");

    item.className =
        "try-item";

    const image =
        document.createElement("img");

    image.src =
        imagePath;

    image.alt =
        sp.ten_sp || "Sản phẩm";

    image.onerror = () => {
        image.src =
            "https://via.placeholder.com/90x110?text=No+Image";
    };

    const info =
        document.createElement("div");

    const title =
        document.createElement("h4");

    title.textContent =
        sp.ten_sp || "";

    const category =
        document.createElement("p");

    category.textContent =
        type;

    const button =
        document.createElement("button");

    button.type =
        "button";

    button.textContent =
        "Thử ngay";

    button.addEventListener("click", () =>
        tryClothes(type, imagePath)
    );

    info.append(title, category, button);
    item.append(image, info);

    return item;
}

function buildUploadUrl(imageFile) {
    if (!imageFile) {
        return "https://via.placeholder.com/90x110?text=No+Image";
    }

    if (
        /^https?:\/\//i.test(imageFile) ||
        imageFile.startsWith("/")
    ) {
        return imageFile;
    }

    if (imageFile.startsWith("uploads/")) {
        return appUrl(`admin/${imageFile}`);
    }

    return appUrl(`admin/uploads/${imageFile}`);
}

function normalizeText(value) {
    return (value || "")
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\u0111/g, "d")
        .replace(/\u0110/g, "d");
}

window.onload = () => {
    updateModel();
    loadTryOnProducts();
};

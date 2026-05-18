<div class="tryon-container">

    <div class="controls">

        <label>Giới tính</label>
        <select id="gender">
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
        </select>

        <label>Chiều cao</label>
        <input type="number" id="height" value="170">

        <label>Cân nặng</label>
        <input type="number" id="weight" value="60">

        <button onclick="updateModel()">
            Cập nhật mô hình
        </button>

        <button onclick="removeClothes()" class="remove-btn">
            Xóa đồ đang thử
        </button>

    </div>

    <div class="model-box" id="modelBox">

        <img id="model" src="../../try_on_images/male.png">

        <img id="shirtLayer" class="clothes-layer">
        <img id="pantsLayer" class="clothes-layer">
        <img id="shoesLayer" class="clothes-layer">

    </div>

    <div class="cart-items">

        <h3>Sản phẩm trong giỏ</h3>

        <div id="tryon-products"></div>

    </div>

</div>

<link rel="stylesheet" href="try_on.css">
<script src="try_on.js"></script>
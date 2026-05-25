# IDM-VTON setup cho tinh nang thu do AI

Website PHP hien goi endpoint:

```txt
main/user/thu_do/try_on/ai_try_on.php
```

Endpoint nay se proxy sang bien moi truong `AI_TRYON_ENDPOINT`. Voi IDM-VTON, chay them gateway Python trong file:

```txt
main/user/thu_do/try_on/idm_vton_gateway.py
```

## 1. Cai IDM-VTON

Repo chinh thuc:

```txt
https://github.com/yisol/IDM-VTON
```

Lenh cai dat theo README chinh thuc:

```bash
git clone https://github.com/yisol/IDM-VTON.git
cd IDM-VTON
conda env create -f environment.yaml
conda activate idm
```

Tai checkpoint human parsing/openpose/densepose theo README cua IDM-VTON, dat vao:

```txt
IDM-VTON/ckpt
```

Sau do chay Gradio demo:

```bash
python gradio_demo/app.py
```

Mac dinh Gradio se mo o:

```txt
http://127.0.0.1:7860
```

## 2. Chay gateway cho website PHP

Trong mot terminal khac:

```bash
pip install flask gradio_client requests
cd D:/Code/VertrigoServ/www/DoAnWeb/main/user/thu_do/try_on
set IDM_VTON_GRADIO_URL=http://127.0.0.1:7860
set IDM_VTON_PUBLIC_BASE_URL=http://127.0.0.1:5005
python idm_vton_gateway.py
```

Gateway se chay o:

```txt
http://127.0.0.1:5005/try-on
```

## 3. Cau hinh PHP/Apache

Them bien moi truong cho Apache/Vertrigo:

```apache
SetEnv AI_TRYON_ENDPOINT "http://127.0.0.1:5005/try-on"
```

Neu dung Windows va khong cau hinh duoc `SetEnv`, co the sua tam trong `ai_try_on.php`:

```php
$endpoint = getenv('AI_TRYON_ENDPOINT') ?: 'http://127.0.0.1:5005/try-on';
```

## 4. Luu y quan trong

IDM-VTON Gradio demo chinh thuc dang hardcode auto-mask cho `upper_body`, nen phu hop nhat voi ao. Quan, vay va giay can them pipeline/mask rieng hoac sua code IDM-VTON de dung category khac.

Anh `model_image_url` va `garment.image_url` phai truy cap duoc tu gateway Python. Neu chay cung may voi website thi URL local cua Vertrigo van dung duoc. Neu AI chay tren server khac, can upload anh len public storage truoc.

IDM-VTON can GPU NVIDIA de render muot. CPU se rat cham hoac het RAM.

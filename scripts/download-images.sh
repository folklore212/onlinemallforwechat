#!/bin/bash

# 微信在线商城示例图片下载脚本
# 使用免费的图片API下载示例图片用于开发和测试

set -e

# 配置
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGES_DIR="${BASE_DIR}/public/uploads"
LOG_FILE="${BASE_DIR}/scripts/download-images.log"

# 创建目录结构
mkdir -p "${IMAGES_DIR}/products/large"
mkdir -p "${IMAGES_DIR}/products/medium"
mkdir -p "${IMAGES_DIR}/products/small"
mkdir -p "${IMAGES_DIR}/products/thumb"
mkdir -p "${IMAGES_DIR}/categories"
mkdir -p "${IMAGES_DIR}/users"
mkdir -p "${IMAGES_DIR}/banners"
mkdir -p "${IMAGES_DIR}/temp"

echo "开始下载示例图片库..." | tee -a "${LOG_FILE}"
echo "图片将保存到: ${IMAGES_DIR}" | tee -a "${LOG_FILE}"

# 下载函数
download_image() {
    local url="$1"
    local output_path="$2"
    local description="$3"

    echo "下载 ${description}..." | tee -a "${LOG_FILE}"

    if curl -s -L -o "${output_path}" "${url}"; then
        echo "  ✓ 成功: ${output_path}" | tee -a "${LOG_FILE}"
    else
        echo "  ✗ 失败: ${url}" | tee -a "${LOG_FILE}"
        # 创建色块占位符图片作为后备
        convert -size 100x100 xc:#cccccc -pointsize 14 -fill black -draw "text 10,50 'Placeholder'" "${output_path}" 2>/dev/null || true
    fi
}

# 检查是否安装了ImageMagick（用于创建后备图片）
if ! command -v convert &> /dev/null; then
    echo "警告: ImageMagick未安装，无法创建后备图片" | tee -a "${LOG_FILE}"
fi

# 商品图片 - 使用Picsum Photos（免费随机图片）
echo "下载商品图片..." | tee -a "${LOG_FILE}"

# 商品大图 (750x750)
for i in {1..10}; do
    download_image \
        "https://picsum.photos/750/750?random=${i}" \
        "${IMAGES_DIR}/products/large/product-${i}.jpg" \
        "商品大图 ${i}"
done

# 商品中图 (400x400)
for i in {1..10}; do
    download_image \
        "https://picsum.photos/400/400?random=$((i+100))" \
        "${IMAGES_DIR}/products/medium/product-${i}.jpg" \
        "商品中图 ${i}"
done

# 商品小图 (200x200)
for i in {1..10}; do
    download_image \
        "https://picsum.photos/200/200?random=$((i+200))" \
        "${IMAGES_DIR}/products/small/product-${i}.jpg" \
        "商品小图 ${i}"
done

# 商品缩略图 (100x100)
for i in {1..10}; do
    download_image \
        "https://picsum.photos/100/100?random=$((i+300))" \
        "${IMAGES_DIR}/products/thumb/product-${i}.jpg" \
        "商品缩略图 ${i}"
done

# 分类图标 (60x60) - 使用占位符创建带文字的图标
echo "下载分类图标..." | tee -a "${LOG_FILE}"
categories=("工装" "制服" "防护服" "其他" "衬衫" "裤子" "外套" "鞋帽")
for i in "${!categories[@]}"; do
    cat_name="${categories[$i]}"
    # 使用不同的背景颜色
    colors=("#1890ff" "#52c41a" "#faad14" "#722ed1" "#eb2f96" "#13c2c2" "#f5222d" "#fa8c16")
    color="${colors[$i % ${#colors[@]}]}"

    # 如果有ImageMagick，创建带文字的图标
    if command -v convert &> /dev/null; then
        convert -size 60x60 "xc:${color}" -pointsize 16 -fill white -gravity center -draw "text 0,0 '${cat_name:0:1}'" "${IMAGES_DIR}/categories/category-$((i+1)).png"
        echo "  ✓ 创建分类图标 ${cat_name}" | tee -a "${LOG_FILE}"
    else
        # 否则下载占位符
        download_image \
            "https://via.placeholder.com/60x60/${color:1}/ffffff?text=${cat_name:0:1}" \
            "${IMAGES_DIR}/categories/category-$((i+1)).png" \
            "分类图标 ${cat_name}"
    fi
done

# 用户头像 (80x80)
echo "下载用户头像..." | tee -a "${LOG_FILE}"
for i in {1..8}; do
    download_image \
        "https://i.pravatar.cc/80?img=${i}" \
        "${IMAGES_DIR}/users/avatar-${i}.jpg" \
        "用户头像 ${i}"
done

# 创建默认头像
if command -v convert &> /dev/null; then
    convert -size 80x80 xc:#1890ff -pointsize 24 -fill white -gravity center -draw "text 0,0 '用户'" "${IMAGES_DIR}/users/default-avatar.png"
    convert -size 80x80 xc:#cccccc -pointsize 24 -fill white -gravity center -draw "text 0,0 '未登录'" "${IMAGES_DIR}/users/guest-avatar.png"
    echo "  ✓ 创建默认头像" | tee -a "${LOG_FILE}"
fi

# 轮播图 (750x300)
echo "下载轮播图..." | tee -a "${LOG_FILE}"
banners=(
    "政企制服采购"
    "专业定制服务"
    "品质保障"
    "快速交付"
)
for i in "${!banners[@]}"; do
    banner_text="${banners[$i]}"
    colors=("#1890ff" "#52c41a" "#faad14" "#722ed1")
    color="${colors[$i % ${#colors[@]}]}"

    if command -v convert &> /dev/null; then
        convert -size 750x300 "xc:${color}" -pointsize 36 -fill white -gravity center -draw "text 0,0 '${banner_text}'" "${IMAGES_DIR}/banners/banner-$((i+1)).png"
        echo "  ✓ 创建轮播图 ${banner_text}" | tee -a "${LOG_FILE}"
    else
        download_image \
            "https://via.placeholder.com/750x300/${color:1}/ffffff?text=${banner_text}" \
            "${IMAGES_DIR}/banners/banner-$((i+1)).png" \
            "轮播图 ${i}"
    fi
done

# 创建favicon
echo "创建favicon..." | tee -a "${LOG_FILE}"
if command -v convert &> /dev/null; then
    # 创建不同尺寸的favicon
    convert -size 16x16 xc:#1890ff "${IMAGES_DIR}/favicon-16x16.png"
    convert -size 32x32 xc:#1890ff "${IMAGES_DIR}/favicon-32x32.png"
    convert -size 64x64 xc:#1890ff "${IMAGES_DIR}/favicon-64x64.png"

    # 创建ICO文件
    convert "${IMAGES_DIR}/favicon-16x16.png" "${IMAGES_DIR}/favicon-32x32.png" "${IMAGES_DIR}/favicon-64x64.png" "${IMAGES_DIR}/favicon.ico"
    echo "  ✓ 创建favicon" | tee -a "${LOG_FILE}"
fi

# 创建图片映射配置文件
echo "创建图片映射配置文件..." | tee -a "${LOG_FILE}"
cat > "${BASE_DIR}/scripts/image-map.json" << EOF
{
  "product": {
    "large": "/uploads/products/large/product-1.jpg",
    "medium": "/uploads/products/medium/product-1.jpg",
    "small": "/uploads/products/small/product-1.jpg",
    "thumb": "/uploads/products/thumb/product-1.jpg"
  },
  "category": "/uploads/categories/category-1.png",
  "user": {
    "default": "/uploads/users/default-avatar.png",
    "guest": "/uploads/users/guest-avatar.png"
  },
  "banner": "/uploads/banners/banner-1.png",
  "favicon": "/uploads/favicon.ico"
}
EOF

echo "图片下载完成!" | tee -a "${LOG_FILE}"
echo "总计下载/创建图片:"
find "${IMAGES_DIR}" -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.ico" \) | wc -l | tee -a "${LOG_FILE}"
echo "图片目录: ${IMAGES_DIR}" | tee -a "${LOG_FILE}"
echo "日志文件: ${LOG_FILE}" | tee -a "${LOG_FILE}"
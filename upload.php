<?php
/**
 * 文件上传处理脚本
 * 接收上传的文件，保存到 upload_file 目录
 */

header('Content-Type: application/json; charset=utf-8');

// 上传目录（相对于本脚本）
$uploadDir = __DIR__ . '/upload_file/';

// 确保上传目录存在
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        echo json_encode([
            'success' => false,
            'message' => '无法创建上传目录'
        ]);
        exit;
    }
}

// 检查是否有文件上传
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errorMsg = '没有上传文件或上传出错';
    if (isset($_FILES['file'])) {
        switch ($_FILES['file']['error']) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $errorMsg = '文件大小超过限制';
                break;
            case UPLOAD_ERR_PARTIAL:
                $errorMsg = '文件只上传了一部分';
                break;
            case UPLOAD_ERR_NO_FILE:
                $errorMsg = '没有选择文件';
                break;
        }
    }
    echo json_encode([
        'success' => false,
        'message' => $errorMsg
    ]);
    exit;
}

$file = $_FILES['file'];
$originalName = $file['name'];
$tmpPath = $file['tmp_name'];

// 安全检查：过滤文件名中的危险字符
$safeName = preg_replace('/[\/\\:*?"<>|]/', '_', $originalName);
// 去除路径穿越
$safeName = basename($safeName);

if (empty($safeName)) {
    echo json_encode([
        'success' => false,
        'message' => '无效的文件名'
    ]);
    exit;
}

$targetPath = $uploadDir . $safeName;

// 移动上传的文件
if (move_uploaded_file($tmpPath, $targetPath)) {
    echo json_encode([
        'success' => true,
        'message' => '文件上传成功',
        'filename' => $safeName
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => '文件保存失败，请检查目录权限'
    ]);
}

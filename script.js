// 为index.html中的button按钮添加点击事件
document.getElementById("bt1")
	?.addEventListener("click", function()
	{
		alert("账号：55544159523，密码：854524");  // 1，""或者''都可以引用内容。  2，"\"为转义字符，显示"\"时，需要写成"\\"
	}
					);	
					
document.getElementById("bt2")
	?.addEventListener("click", function()
	{
		alert('Win+R回车后，输入如下指令；然后windows暂停更新中，选择下拉菜单到最下面。：reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\WindowsUpdate\\UX\\Settings" /v FlightSettingsMaxPauseDays /t reg_dword /d 10000 /f');
	}
					);

document.getElementById("bt3")
	?.addEventListener("click", function()
	{
		alert("例如:3GPP 38.协议下载 FTP中,38.201文件夹，点进去，显示各版本的38.201协议，后缀的f00表示r15版第1稿；以此类推，后缀h00表示r17版第一稿；后缀j00表示r19版第一稿。")
	}
					);
					
					
					
// ----------------- 留言板相关 ----------------- //
// 配置信息（https://jsonbin.io/app/bins）
        const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3/b';
        const BIN_ID = '691a7e86ae596e708f5dbff0';
        const MASTER_KEY = '$2a$10$po8ENhUy830cwexdzeL0juiiYNjZ4REEbr/.NDk6tBTm1X7inWZvW';
        
        // 全局变量
        let selectedFile = null;
        let isSubmitting = false;
        
        // 初始化
        document.addEventListener('DOMContentLoaded', function() {
            loadMessagesFromOnline();
            setupEventListeners();
        });
        
        // 设置事件监听器
        function setupEventListeners() {
            // 文件上传区域点击事件
            document.getElementById('fileUploadArea').addEventListener('click', function() {
                document.getElementById('fileInput').click();
            });
            
            // 文件选择事件
            document.getElementById('fileInput').addEventListener('change', function(e) {
                if (e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                }
            });
            
            // 拖拽事件
            const uploadArea = document.getElementById('fileUploadArea');
            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', function(e) {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) {
                    handleFileSelect(e.dataTransfer.files[0]);
                }
            });
            
            // 移除文件事件
            document.getElementById('removeFile').addEventListener('click', function() {
                clearFileSelection();
            });
            
            // 表单提交事件
            document.getElementById('messageForm').addEventListener('submit', function(e) {
                e.preventDefault();
                submitMessage();
            });
            
            

        }
        
        // 处理文件选择
        function handleFileSelect(file) {
            if (!file) return;
            
            // 检查文件大小（限制为100KB）
            const maxSize = 100 * 1024;
            if (file.size > maxSize) {
                showStatus(`文件太大，请选择小于 ${formatFileSize(maxSize)} 的文件`, 'error');
                return;
            }
            
            selectedFile = file;
            
            // 显示文件预览
            const filePreview = document.getElementById('filePreview');
            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileSize').textContent = formatFileSize(file.size);
            document.getElementById('fileIcon').innerHTML = `<i class="${getFileIconClass(file.name)}"></i>`;
            
            filePreview.style.display = 'block';
            
            showStatus(`已选择文件: ${file.name}`, 'success');
        }
        
        // 清除文件选择
        function clearFileSelection() {
            document.getElementById('filePreview').style.display = 'none';
            document.getElementById('fileInput').value = '';
            selectedFile = null;
            showStatus('文件已移除', 'success');
        }
        
        // 清空表单
        function clearForm() {
            document.getElementById('author').value = '';
            document.getElementById('content').value = '';
            clearFileSelection();
            showStatus('表单已清空', 'success');
        }
        
        // 提交留言
        async function submitMessage() {
            if (isSubmitting) return;
            
            const author = document.getElementById('author').value.trim();
            const content = document.getElementById('content').value.trim();
            
            if (!content) {
                showStatus('请输入留言内容', 'error');
                return;
            }
            
            isSubmitting = true;
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.innerHTML = '<div class="loading"></div> 发布中...';
            submitBtn.disabled = true;
            
            try {
                // 获取现有留言
                const messages = await getMessagesFromOnline();
                
                // 准备新留言
                const newMessage = {
                    id: generateId(),
                    author: author || '匿名用户',
                    content: content,
                    timestamp: new Date().toISOString()
                };
                
                // 如果有附件，添加到留言中
                if (selectedFile) {
                    try {
                        const fileData = await fileToBase64(selectedFile);
                        newMessage.attachment = {
                            filename: selectedFile.name,
                            size: selectedFile.size,
                            type: selectedFile.type,
                            data: fileData
                        };
                    } catch (error) {
                        console.error('文件处理失败:', error);
                        showStatus('文件处理失败，请重试', 'error');
                        return;
                    }
                }
                
                // 添加新留言
                messages.push(newMessage);
                
                // 保存到在线服务
                const success = await saveMessagesToOnline(messages);
                
                if (success) {
                    // 清空表单
                    clearForm();
                    
                    // 显示留言
                    displayMessages(messages);
                    
                    showStatus('留言发布成功！', 'success');
                } else {
                    showStatus('发布失败，请检查网络连接', 'error');
                }
            } catch (error) {
                console.error('提交留言失败:', error);
                showStatus('提交失败: ' + error.message, 'error');
            } finally {
                isSubmitting = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 发布留言';
                submitBtn.disabled = false;
            }
        }
        
        // 从在线服务获取留言
        async function getMessagesFromOnline() {
            try {
                const response = await fetch(`${JSONBIN_BASE_URL}/${BIN_ID}/latest`, {
                    headers: {
                        'X-Master-Key': MASTER_KEY
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // 处理不同的数据结构
                let messages = [];
                
                if (data.record) {
                    if (Array.isArray(data.record)) {
                        messages = data.record;
                    } else if (typeof data.record === 'object' && data.record.messages) {
                        messages = data.record.messages;
                    } else if (typeof data.record === 'object') {
                        messages = [data.record];
                    }
                }
                
                // 确保是数组
                if (!Array.isArray(messages)) {
                    messages = [];
                }
                
                return messages;
            } catch (error) {
                console.error('获取留言失败:', error);
                showStatus('获取留言失败: ' + error.message, 'error');
                return [];
            }
        }
        
        // 从在线服务加载留言
        async function loadMessagesFromOnline() {
			const messages = await getMessagesFromOnline();
			displayMessages(messages);
			showStatus(`成功加载 ${messages.length} 条留言`, 'success');
        }
        
        // 保存留言到在线服务
        async function saveMessagesToOnline(messages) {
            try {
                // 确保保存的是数组格式
                const dataToSave = Array.isArray(messages) ? messages : [messages];
                
                const response = await fetch(`${JSONBIN_BASE_URL}/${BIN_ID}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': MASTER_KEY
                    },
                    body: JSON.stringify(dataToSave)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`保存失败: ${response.status} - ${errorText}`);
                }
                
                return true;
            } catch (error) {
                console.error('保存留言失败:', error);
                return false;
            }
        }
        
        // 显示留言
        function displayMessages(messages) {
            const container = document.getElementById('messagesContainer');

            
            if (!Array.isArray(messages) || messages.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px;"></i>
                        <p>暂无留言，请发布第一条留言</p>
                    </div>
                `;

                return;
            }
            
            // 按时间倒序排列
            const sortedMessages = [...messages].sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            );
            
            container.innerHTML = sortedMessages.map(msg => {
                return `
                    <div class="message-item">
                        <div class="message-header">
                            <div class="message-author">${escapeHtml(msg.author)}</div>
                            <div class="message-time">${formatDate(msg.timestamp)}</div>
                        </div>
                        <div class="message-content">${escapeHtml(msg.content)}</div>
                        ${msg.attachment ? `
                            <div class="message-attachment">
                                <a href="#" class="attachment-link" data-filename="${msg.attachment.filename}" data-filedata="${msg.attachment.data}" data-filetype="${msg.attachment.type}">
                                    <i class="${getFileIconClass(msg.attachment.filename)}"></i> ${escapeHtml(msg.attachment.filename)}
                                    <span class="file-size">${formatFileSize(msg.attachment.size)}</span>
                                </a>
                            </div>
                        ` : ''}
						<!--
                        <div style="margin-top: 10px; text-align: right;">
                            <button class="btn btn-secondary" onclick="editMessage('${msg.id}')" style="padding: 5px 10px; font-size: 14px;">
                                <i class="fas fa-edit"></i> 编辑
                            </button>
                            <button class="btn btn-danger" onclick="deleteMessage('${msg.id}')" style="padding: 5px 10px; font-size: 14px;">
                                <i class="fas fa-trash"></i> 删除
                            </button>
                        </div>
						-->
                    </div>
                `;
            }).join('');
            
            // 添加附件下载事件
            container.querySelectorAll('.attachment-link').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const filename = this.getAttribute('data-filename');
                    const fileData = this.getAttribute('data-filedata');
                    const fileType = this.getAttribute('data-filetype');
                    
                    downloadFile(fileData, filename, fileType);
                });
            });

        }
        
        // 编辑留言
        async function editMessage(messageId) {
            const messages = await getMessagesFromOnline();
            const message = messages.find(m => m.id === messageId);
            
            if (!message) {
                showStatus('未找到要编辑的留言', 'error');
                return;
            }
            
            const newContent = prompt('编辑留言内容:', message.content);
            if (newContent !== null && newContent.trim() !== '') {
                message.content = newContent.trim();
                message.timestamp = new Date().toISOString();
                
                if (await saveMessagesToOnline(messages)) {
                    displayMessages(messages);
                    showStatus('留言已更新', 'success');
                } else {
                    showStatus('更新失败', 'error');
                }
            }
        }
        
        // 删除留言
        async function deleteMessage(messageId) {
            if (!confirm('确定要删除这条留言吗？')) {
                return;
            }
            
            const messages = await getMessagesFromOnline();
            const filteredMessages = messages.filter(m => m.id !== messageId);
            
            if (await saveMessagesToOnline(filteredMessages)) {
                displayMessages(filteredMessages);
                showStatus('留言已删除', 'success');
            } else {
                showStatus('删除失败', 'error');
            }
        }
        

        
        // 将文件转换为Base64
        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    // 移除数据URL前缀（如"data:image/png;base64,"）
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
        }
        
        // 从Base64下载文件
        function downloadFile(base64Data, filename, mimeType) {
            // 创建Blob对象
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], {type: mimeType});
            
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showStatus(`文件 "${filename}" 下载中...`, 'success');
        }
        
        // 显示状态信息
        function showStatus(message, type = 'success') {
            const statusEl = document.getElementById('status');
            statusEl.innerHTML = `<div class="status ${type}">${message}</div>`;
            
            // 1.3秒后自动隐藏成功消息
            if (type === 'success') {
                setTimeout(() => {
                    statusEl.innerHTML = '';
                }, 1200); 
            }
        }
        
        // 工具函数
        function generateId() {
            return Date.now() + Math.random().toString(36).substr(2, 9);
        }
        
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        function getFileIconClass(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            const icons = {
                'pdf': 'fas fa-file-pdf',
                'doc': 'fas fa-file-word',
                'docx': 'fas fa-file-word',
                'txt': 'fas fa-file-alt',
                'jpg': 'fas fa-file-image',
                'jpeg': 'fas fa-file-image',
                'png': 'fas fa-file-image',
                'gif': 'fas fa-file-image',
                'zip': 'fas fa-file-archive',
                'rar': 'fas fa-file-archive',
                'mp3': 'fas fa-file-audio',
                'mp4': 'fas fa-file-video',
                'xls': 'fas fa-file-excel',
                'xlsx': 'fas fa-file-excel'
            };
            return icons[ext] || 'fas fa-file';
        }
        
        function formatDate(dateString) {
            return new Date(dateString).toLocaleString('zh-CN');
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

// 页面加载时尝试加载留言
window.onload = loadMessagesFromOnline;























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
					







// ----------------- 留言板相关（Github Token） ----------------- //
// GitHub配置 - 需要根据实际情况修改
function getFullToken() {
	const part1 = 'ghp_k4uMVQ5ufIwr2f75';   // Expires on 20xx.xx.xx
	const part2 = '9Get7XF02atlPM2Mlia7';   // Expires on 20xx.xx.xx
	return part1 + part2;
}

const GITHUB_CONFIG = {
	owner: '54LY',
	repo: '5461',
	token: getFullToken()
};

// 全局变量
let selectedFile = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
	setupEventListeners();
	loadMessages();
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
		uploadArea.style.borderColor = '#3498db';
		uploadArea.style.background = '#f0f7ff';
	});
	
	uploadArea.addEventListener('dragleave', function(e) {
		e.preventDefault();
		uploadArea.style.borderColor = '#bdc3c7';
		uploadArea.style.background = '#f8f9fa';
	});
	
	uploadArea.addEventListener('drop', function(e) {
		e.preventDefault();
		uploadArea.style.borderColor = '#bdc3c7';
		uploadArea.style.background = '#f8f9fa';
		if (e.dataTransfer.files.length > 0) {
			handleFileSelect(e.dataTransfer.files[0]);
		}
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
	
	// 检查文件大小（限制为25MB）
	const maxSize = 25 * 1024 * 1024;
	if (file.size > maxSize) {
		showStatus(`文件太大，请选择小于 ${formatFileSize(maxSize)} 的文件`, 'error');
		return;
	}
	
	selectedFile = file;
	
	// 显示文件预览
	const filePreview = document.getElementById('filePreview');
	document.getElementById('fileName').textContent = file.name;
	document.getElementById('fileSize').textContent = formatFileSize(file.size);
	
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

// 提交留言到GitHub
async function submitMessage() {
	const author = document.getElementById('author').value.trim();
	const message = document.getElementById('message').value.trim();
	
	if (!author || !message) {
		showStatus('请填写姓名和留言内容', 'error');
		return;
	}
	
	const submitBtn = document.getElementById('submitBtn');
	submitBtn.innerHTML = '<div class="loading"></div> 发布中...';
	submitBtn.disabled = true;
	
	try {
		// 如果有文件，先上传文件到GitHub
		let fileUrl = null;
		if (selectedFile) {
			fileUrl = await uploadFileToGitHub(selectedFile);
		}
		
		// 创建Issue作为留言
		const issueTitle = `留言来自: ${author}`;
		let issueBody = `**留言者:** ${author}\n`;
		issueBody += `**时间:** ${new Date().toLocaleString('zh-CN')}\n\n`;
		issueBody += `**内容:**\n${message}\n\n`;
		if (fileUrl) issueBody += `**附件:** [下载链接](${fileUrl})`;
		
		const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues`, {
			method: 'POST',
			headers: {
				'Authorization': `token ${GITHUB_CONFIG.token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				title: issueTitle,
				body: issueBody,
				labels: ['留言板']
			})
		});
		
		if (response.ok) {
			showStatus('留言发布成功！', 'success');
			document.getElementById('messageForm').reset();
			clearFileSelection();
			loadMessages(); // 刷新留言列表
		} else {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
	} catch (error) {
		console.error('提交留言失败:', error);
		showStatus('发布失败: ' + error.message, 'error');
	} finally {
		submitBtn.innerHTML = '发布留言';
		submitBtn.disabled = false;
	}
}

// 上传文件到GitHub仓库
async function uploadFileToGitHub(file) {
	const fileContent = await fileToBase64(file);
	const fileName = `uploads/${Date.now()}_${file.name}`;
	
	const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${fileName}`, {
		method: 'PUT',
		headers: {
			'Authorization': `token ${GITHUB_CONFIG.token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			message: `上传文件: ${file.name}`,
			content: fileContent
		})
	});
	
	if (response.ok) {
		const data = await response.json();
		return data.content.download_url;
	} else {
		throw new Error('文件上传失败');
	}
}

// 从GitHub加载留言
async function loadMessages() {
	const messagesContainer = document.getElementById('messagesContainer');
	messagesContainer.innerHTML = '<div class="status info">正在加载留言...</div>';
	
	try {
		const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues?labels=留言板`);
		
		if (response.ok) {
			const issues = await response.json();
			displayMessages(issues);
		} else {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
	} catch (error) {
		console.error('加载留言失败:', error);
		messagesContainer.innerHTML = `<div class="status error">加载失败: ${error.message}</div>`;
	}
}

// 显示留言
function displayMessages(issues) {
	const container = document.getElementById('messagesContainer');
	
	if (!Array.isArray(issues) || issues.length === 0) {
		container.innerHTML = '<div class="status info">暂无留言，成为第一个留言者吧！</div>';
		return;
	}
	
	// 按创建时间倒序排列
	issues.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
	
	container.innerHTML = issues.map(issue => {
		// 解析Issue内容
		const body = issue.body || '';
		const lines = body.split('\n');
		
		let author = '匿名用户';
		let time = new Date(issue.created_at).toLocaleString('zh-CN');
		let content = '';
		let attachmentUrl = null;
		
		for (const line of lines) {
			if (line.startsWith('**留言者:**')) author = line.replace('**留言者:**', '').trim();
			if (line.startsWith('**时间:**')) time = line.replace('**时间:**', '').trim();
			if (line.startsWith('**内容:**')) content = lines[lines.indexOf(line) + 1] || '';
			if (line.startsWith('**附件:**')) {
				const match = line.match(/\[下载链接\]\((.*?)\)/);
				if (match) attachmentUrl = match[1];
			}
		}
		
		return `
			<div class="message-item">
				<div class="message-header">
					<div class="message-author">${escapeHtml(author)}</div>
					<div class="message-time">${time}</div>
				</div>
				<div class="message-content">${escapeHtml(content)}</div>
				${attachmentUrl ? `
					<div class="message-attachment">
						<a href="${attachmentUrl}" target="_blank" class="attachment-link">
							📎 下载附件
						</a>
					</div>
				` : ''}
			</div>
		`;
	}).join('');
}

// 工具函数
function fileToBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			// 移除数据URL前缀
			const base64 = reader.result.split(',')[1];
			resolve(base64);
		};
		reader.onerror = error => reject(error);
		reader.readAsDataURL(file);
	});
}

function formatFileSize(bytes) {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

function showStatus(message, type = 'success') {
	const statusEl = document.getElementById('status');
	statusEl.innerHTML = `<div class="status ${type}">${message}</div>`;
	
	if (type === 'success') {
		setTimeout(() => {
			statusEl.innerHTML = '';
		}, 5000);
	}
}











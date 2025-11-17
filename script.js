// 为首页的“了解更多”按钮添加点击事件
document.getElementById("learnMore")
	?.addEventListener("click", function()
	{
		alert("Welcome My Site!");
	}
					);
					
				


				
// ----------------- 留言板相关 ----------------- //
// 配置信息（https://jsonbin.io/app/bins）
const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3/b';
const BIN_ID = '691a7e86ae596e708f5dbff0';
const MASTER_KEY = '$2a$10$po8ENhUy830cwexdzeL0juiiYNjZ4REEbr/.NDk6tBTm1X7inWZvW';

// 生成唯一ID
function generateId() {
	return Date.now() + Math.random().toString(36).substr(2, 9);
}

// 调试信息显示
function showDebugInfo(message) {
	//const debugEl = document.getElementById('debugInfo');
	//debugEl.innerHTML = `<strong>调试信息:</strong> ${message}`;
	console.log('调试:', message);
}

// 显示状态信息
function showStatus(message, type = 'success') {
	const statusEl = document.getElementById('status');
	statusEl.innerHTML = `<div class="status ${type}">${message}</div>`;
	setTimeout(() => statusEl.innerHTML = '', 5000);
}

// 从在线服务获取留言
async function loadMessagesFromOnline() {
	try {
		showStatus('正在加载留言...');
		showDebugInfo('发送请求到JSONBin.io...');
		
		const response = await fetch(`${JSONBIN_BASE_URL}/${BIN_ID}/latest`, {
			headers: {
				'X-Master-Key': MASTER_KEY
			}
		});
		
		showDebugInfo(`响应状态: ${response.status}`);
		
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		
		const data = await response.json();
		console.log('完整响应数据:', data);
		
		// 处理不同的数据结构
		let messages = [];
		
		if (data.record) {
			if (Array.isArray(data.record)) {
				// 情况1：record是数组（期望的结构）
				messages = data.record;
				showDebugInfo('数据结构：数组格式');
			} else if (typeof data.record === 'object' && data.record.messages) {
				// 情况2：record是对象，包含messages数组
				messages = data.record.messages;
				showDebugInfo('数据结构：对象包含messages数组');
			} else if (typeof data.record === 'object') {
				// 情况3：record是单个留言对象
				messages = [data.record];
				showDebugInfo('数据结构：单个留言对象');
			} else {
				// 情况4：其他未知结构
				messages = [];
				showDebugInfo('数据结构：未知格式，已重置为空数组');
			}
		} else {
			// 情况5：record字段不存在
			messages = [];
			showDebugInfo('record字段不存在，使用空数组');
		}
		
		// 确保是数组
		if (!Array.isArray(messages)) {
			messages = [];
		}
		
		displayMessages(messages);
		showStatus(`成功加载 ${messages.length} 条留言`);
		
	} catch (error) {
		console.error('加载留言失败:', error);
		showDebugInfo(`加载失败: ${error.message}`);
		showStatus('加载留言失败: ' + error.message, 'error');
	}
}

// 保存留言到在线服务
async function saveMessagesToOnline(messages) {
	try {
		showDebugInfo('正在保存留言...');
		
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
		
		showDebugInfo(`保存响应状态: ${response.status}`);
		
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`保存失败: ${response.status} - ${errorText}`);
		}
		
		const result = await response.json();
		console.log('保存成功:', result);
		return true;
		
	} catch (error) {
		console.error('保存留言失败:', error);
		showDebugInfo(`保存失败: ${error.message}`);
		return false;
	}
}

// 显示留言列表
function displayMessages(messages) {
	const container = document.getElementById('messagesContainer');
	
	if (!Array.isArray(messages) || messages.length === 0) {
		container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">暂无留言</p>';
		return;
	}
	
	// 按时间倒序排列
	const sortedMessages = [...messages].sort((a, b) => 
		new Date(b.created_at || b.date || b.timestamp || 0) - 
		new Date(a.created_at || a.date || a.timestamp || 0)
	);
	
	container.innerHTML = sortedMessages.map(msg => {
		// 处理不同的字段名
		const author = msg.author || msg.name || msg.user || '匿名用户';
		const content = msg.content || msg.text || msg.message || '无内容';
		const time = msg.created_at || msg.date || msg.timestamp || new Date().toISOString();
		
		return `
			<div class="message-item">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
					<div style="font-weight: bold; color: #333;">${escapeHtml(author)}</div>
					<div style="color: #666; font-size: 0.9em;">${formatDate(time)}</div>
				</div>
				<div style="line-height: 1.5; color: #444;">${escapeHtml(content)}</div>
			</div>
		`;
	}).join('');
}

// 防止XSS攻击
function escapeHtml(text) {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

// 格式化日期
function formatDate(dateString) {
	try {
		return new Date(dateString).toLocaleString('zh-CN');
	} catch (e) {
		return '未知时间';
	}
}

// 提交留言
document.getElementById('messageForm').addEventListener('submit', async function(e) {
	e.preventDefault();
	
	const author = document.getElementById('author').value.trim();
	const content = document.getElementById('content').value.trim();
	
	if (!content) {
		showStatus('请输入留言内容', 'error');
		return;
	}
	
	// 先加载现有留言
	let existingMessages = [];
	try {
		const response = await fetch(`${JSONBIN_BASE_URL}/${BIN_ID}/latest`, {
			headers: {'X-Master-Key': MASTER_KEY}
		});
		
		if (response.ok) {
			const data = await response.json();
			if (data.record) {
				existingMessages = Array.isArray(data.record) ? data.record : [data.record];
			}
		}
	} catch (error) {
		console.error('加载现有留言失败:', error);
	}
	
	// 确保是数组
	if (!Array.isArray(existingMessages)) {
		existingMessages = [];
	}
	
	// 添加新留言
	const newMessage = {
		id: generateId(),
		author: author || null,
		content: content,
		created_at: new Date().toISOString()
	};
	
	existingMessages.push(newMessage);
	
	// 保存到在线服务
	if (await saveMessagesToOnline(existingMessages)) {
		document.getElementById('content').value = '';
		document.getElementById('author').value = '';
		displayMessages(existingMessages);
		showStatus('留言发布成功！');
	} else {
		showStatus('发布失败，请检查网络连接', 'error');
	}
});

// 绑定按钮事件
//document.getElementById('loadBtn').addEventListener('click', loadMessagesFromOnline);
//document.getElementById('resetBtn').addEventListener('click', resetBin);

// 页面加载时尝试加载留言
window.onload = loadMessagesFromOnline;

	
const dataBindings = [
    { input: 'input-game-img', target: 'out-game-img', attr: 'src' },
    { input: 'input-game-title', target: 'out-game-title', attr: 'innerText' },
    { input: 'input-game-desc', target: 'out-game-desc', attr: 'innerText' },
    { input: 'input-msg-text', target: 'out-msg-text', attr: 'innerText' },
    { input: 'input-sender-avatar', target: 'out-sender-avatar', attr: 'src' },
    { input: 'input-msg-name', target: 'out-msg-name', attr: 'innerText' },
    { input: 'input-status-name', target: 'out-status-name', attr: 'innerText' },
    {
        input: 'input-status-date',
        target: 'out-status-date',
        attr: 'innerText',
        // 特殊情况隔离：在这里把 YYYY-MM-DD 转换成 Steam 风格的 X月 X日
        format: function (val) {
            if (!val) return '未知日期';
            // 原生 date 控件返回的是 ISO 格式的 yyyy-mm-dd
            const parts = val.split('-');
            if (parts.length === 3) {
                // parseInt 去除月份和日期前置的 0 (比如 01月 变成 1月)
                return parseInt(parts[1], 10) + '月 ' + parseInt(parts[2], 10) + '日';
            }
            return val;
        }
    }
];

// 遍历映射表，为每个输入框绑定实时监听
dataBindings.forEach(binding => {
    const inputEl = document.getElementById(binding.input);
    const targetEl = document.getElementById(binding.target);

    // 初始化时强制触发一次格式化（防止初始值就是 YYYY-MM-DD 格式暴露给界面）
    if (binding.format && inputEl.value) {
        targetEl[binding.attr] = binding.format(inputEl.value);
    }

    inputEl.addEventListener('input', function () {
        const finalValue = binding.format ? binding.format(this.value) : this.value;
        targetEl[binding.attr] = finalValue;
    });
});

// --- 新增：Steam API 抓取引擎 ---
const btnFetch = document.getElementById('btn-fetch');
const inputAppId = document.getElementById('input-appid');

btnFetch.addEventListener('click', async function () {
    const appId = inputAppId.value.trim();
    if (!appId || isNaN(appId)) {
        alert('别闹，输入一个正确的数字 AppID。');
        return;
    }

    // 修改按钮状态，给用户一点反馈
    const originalText = this.innerText;
    this.innerText = '抓取中...';
    this.disabled = true;

    try {
        const targetUrl = `/api/proxy?appId=${appId}`;

        const response = await fetch(targetUrl);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        if (data[appId] && data[appId].success) {
            const gameInfo = data[appId].data;

            document.getElementById('input-game-title').value = gameInfo.name;
            document.getElementById('input-game-desc').value = gameInfo.short_description;
            document.getElementById('input-game-img').value = gameInfo.header_image;

            ['input-game-title', 'input-game-desc', 'input-game-img'].forEach(id => {
                document.getElementById(id).dispatchEvent(new Event('input'));
            });
        } else {
            alert('Steam 接口返回失败。AppID 错误，或者这游戏锁区了。');
        }
    } catch (error) {
        alert('抓取失败。\n报错信息: ' + error.message);
    } finally {
        this.innerText = originalText;
        this.disabled = false;
    }
});


document.getElementById('btn-download').addEventListener('click', function () {
    const targetElement = document.querySelector('.steam-window');
    const originalText = this.innerText;

    // 改变按钮状态防止连点
    this.innerText = '正在渲染...';
    this.disabled = true;
    this.style.opacity = '0.5';

    // 调用 html2canvas 重绘 DOM
    html2canvas(targetElement, {
        useCORS: true,        // 【极其关键】允许尝试加载跨域的 Steam 图片
        backgroundColor: null,// 保持背景透明或者使用默认底色
        scale: 2              // 提高清晰度（Retina 级别输出）
    }).then(canvas => {
        // 将画布转换为 Base64 图片数据
        const imgData = canvas.toDataURL('image/png');

        // 创建一个虚拟的 <a> 标签触发下载
        const link = document.createElement('a');
        link.download = 'steam-gift-simulator.png'; // 下载的文件名
        link.href = imgData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }).catch(error => {
        // 如果报错，99% 的情况是因为 Steam 的图片服务器拒绝了跨域请求
        console.error('渲染失败:', error);
        alert('图片导出失败。这通常是因为 Steam 的头像或封面图片拒绝了跨域抓取 (CORS Taint)。\n\nLinus建议：请直接使用系统的截图快捷键 (Win+Shift+S)。');
    }).finally(() => {
        // 恢复按钮状态
        this.innerText = originalText;
        this.disabled = false;
        this.style.opacity = '1';
    });
});
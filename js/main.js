/**
 * 智送城市货运智能调度系统 - 主逻辑
 * 负责初始化应用、控制界面切换、全局事件处理
 */

// 全局配置和常量
const CONFIG = {
    // 应用版本
    VERSION: '1.0.0',
    // 模拟延迟(毫秒)，用于演示目的
    DEMO_DELAY: 800,
    // 默认中心位置 (以东营市为例)
    DEFAULT_CENTER: [118.6743, 37.4340],
    // API端点(模拟)
    API_ENDPOINTS: {
        orders: 'api/orders',
        drivers: 'api/drivers',
        routes: 'api/routes'
    }
};

// 全局状态管理
const AppState = {
    // 当前界面 ('user', 'driver', 'admin')
    currentInterface: 'user',
    // 当前用户(模拟)
    currentUser: null,
    // 登录状态
    isLoggedIn: false,
    // 系统消息队列
    notifications: [],
    // 用户角色
    userRole: 'guest'
};

// DOM 加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

/**
 * 应用程序初始化
 */
function initApp() {
    console.log(`智送系统 v${CONFIG.VERSION} 初始化中...`);
    
    // 设置导航事件监听
    setupNavigation();
    
    // 初始化界面
    initializeInterface();
    
    // 模拟加载数据
    simulateDataLoading();
    
    // 设置全局事件处理
    setupGlobalEventListeners();
    
    console.log('应用初始化完成');
}

/**
 * 设置导航栏事件监听
 */
function setupNavigation() {
    // 获取所有导航项
    const navLinks = document.querySelectorAll('.main-nav a');
    
    // 为每个导航项添加点击事件
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 获取目标界面ID
            const targetInterface = link.id.split('-')[1]; // 例如 'nav-user' -> 'user'
            
            // 切换界面
            switchInterface(targetInterface);
            
            // 更新导航激活状态
            updateNavActiveState(link);
        });
    });
    
    // 登录/注册按钮事件
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginModal();
        });
    }
}

/**
 * 切换界面
 * @param {string} interfaceId - 目标界面ID
 */
function switchInterface(interfaceId) {
    // 隐藏所有界面
    const interfaces = document.querySelectorAll('.interface');
    interfaces.forEach(interface => {
        interface.classList.add('hidden');
    });
    
    // 显示目标界面
    const targetInterface = document.getElementById(`${interfaceId}-interface`);
    if (targetInterface) {
        targetInterface.classList.remove('hidden');
        AppState.currentInterface = interfaceId;
        
        // 如果是地图界面，需要触发地图重绘
        if (window.mapInstances && window.mapInstances[`${interfaceId}-map`]) {
            window.mapInstances[`${interfaceId}-map`].resize();
        }
    }
    
    console.log(`界面已切换至: ${interfaceId}`);
}

/**
 * 更新导航激活状态
 * @param {HTMLElement} activeLink - 当前激活的导航链接
 */
function updateNavActiveState(activeLink) {
    // 移除所有导航项的激活状态
    const navLinks = document.querySelectorAll('.main-nav a');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // 为当前项添加激活状态
    activeLink.classList.add('active');
}

/**
 * 初始化界面
 */
function initializeInterface() {
    // 默认显示用户界面
    switchInterface('user');
    
    // 初始化登录模态框
    initLoginModal();
    
    // 根据角色调整界面
    updateInterfaceByRole();
}

/**
 * 根据用户角色更新界面元素
 */
function updateInterfaceByRole() {
    const { userRole } = AppState;
    
    // 根据角色隐藏/显示特定元素
    if (userRole === 'admin') {
        // 显示管理员专属功能
        document.querySelectorAll('.admin-only').forEach(el => {
            el.classList.remove('hidden');
        });
    } else {
        // 隐藏管理员专属功能
        document.querySelectorAll('.admin-only').forEach(el => {
            el.classList.add('hidden');
        });
    }
}

/**
 * 初始化登录模态框
 */
function initLoginModal() {
    const loginModal = document.getElementById('login-modal');
    if (!loginModal) return;
    
    // 创建模态框内容
    loginModal.innerHTML = `
        <div class="modal-content">
            <h2>登录/注册</h2>
            <div class="form-group">
                <label>手机号码</label>
                <input type="tel" id="login-phone" placeholder="请输入手机号码">
            </div>
            <div class="form-group">
                <label>验证码</label>
                <div style="display:flex">
                    <input type="text" id="login-code" placeholder="请输入验证码" style="flex:1">
                    <button class="secondary-btn" id="send-code-btn" style="margin-left:10px">发送验证码</button>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:20px">
                <button class="secondary-btn" id="cancel-login-btn">取消</button>
                <button class="primary-btn" id="confirm-login-btn">登录/注册</button>
            </div>
        </div>
    `;
    
    // 设置模态框按钮事件
    document.getElementById('cancel-login-btn').addEventListener('click', () => {
        loginModal.classList.add('hidden');
    });
    
    document.getElementById('confirm-login-btn').addEventListener('click', () => {
        // 模拟登录逻辑
        const phone = document.getElementById('login-phone').value;
        if (phone) {
            simulateLogin(phone);
            loginModal.classList.add('hidden');
        }
    });
    
    document.getElementById('send-code-btn').addEventListener('click', () => {
        const phone = document.getElementById('login-phone').value;
        if (phone && phone.length === 11) {
            // 模拟发送验证码
            const btn = document.getElementById('send-code-btn');
            btn.disabled = true;
            btn.textContent = '已发送(60s)';
            
            // 倒计时
            let countdown = 60;
            const timer = setInterval(() => {
                countdown--;
                if (countdown <= 0) {
                    clearInterval(timer);
                    btn.disabled = false;
                    btn.textContent = '发送验证码';
                } else {
                    btn.textContent = `已发送(${countdown}s)`;
                }
            }, 1000);
            
            showNotification('验证码已发送，请查收');
        } else {
            showNotification('请输入正确的手机号码', 'error');
        }
    });
}

/**
 * 显示登录模态框
 */
function showLoginModal() {
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.classList.remove('hidden');
    }
}

/**
 * 模拟登录过程
 * @param {string} phone - 手机号
 */
function simulateLogin(phone) {
    // 模拟身份判断 (以手机号最后一位为例)
    const lastDigit = phone.slice(-1);
    let role = 'user';
    
    if (lastDigit === '8') {
        role = 'driver';
    } else if (lastDigit === '9') {
        role = 'admin';
    }
    
    // 更新应用状态
    AppState.isLoggedIn = true;
    AppState.userRole = role;
    AppState.currentUser = {
        phone,
        name: `用户${phone.slice(-4)}`,
        role
    };
    
    // 更新UI显示
    const userInfoEl = document.querySelector('.user-info');
    userInfoEl.innerHTML = `
        <span class="username">${AppState.currentUser.name}</span>
        <a href="#" class="logout-btn">退出</a>
    `;
    
    // 添加退出登录事件
    document.querySelector('.logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    
    // 根据角色切换界面
    if (role === 'driver') {
        switchInterface('driver');
        document.getElementById('nav-driver').click();
    } else if (role === 'admin') {
        switchInterface('admin');
        document.getElementById('nav-admin').click();
    }
    
    // 更新界面
    updateInterfaceByRole();
    
    showNotification(`欢迎回来，${AppState.currentUser.name}！`, 'success');
}

/**
 * 退出登录
 */
function logout() {
    // 重置应用状态
    AppState.isLoggedIn = false;
    AppState.userRole = 'guest';
    AppState.currentUser = null;
    
    // 更新UI显示
    const userInfoEl = document.querySelector('.user-info');
    userInfoEl.innerHTML = `
        <span class="username">游客</span>
        <a href="#" class="login-btn">登录/注册</a>
    `;
    
    // 重新绑定登录按钮事件
    document.querySelector('.login-btn').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginModal();
    });
    
    // 切换到用户界面
    switchInterface('user');
    document.getElementById('nav-user').click();
    
    // 更新界面
    updateInterfaceByRole();
    
    showNotification('您已成功退出登录', 'info');
}

/**
 * 设置全局事件监听
 */
function setupGlobalEventListeners() {
    // 示例：监听窗口大小变化，更新地图
    window.addEventListener('resize', () => {
        if (window.mapInstances) {
            for (const mapId in window.mapInstances) {
                if (window.mapInstances.hasOwnProperty(mapId)) {
                    window.mapInstances[mapId].resize();
                }
            }
        }
    });
    
    // 示例：监听按键事件
    document.addEventListener('keydown', (e) => {
        // ESC键关闭模态框
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                modal.classList.add('hidden');
            });
        }
    });
}

/**
 * 显示系统通知
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型 ('info', 'success', 'warning', 'error')
 */
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            ${message}
        </div>
    `;
    
    // 判断是否已有通知容器
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        // 创建通知容器
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // 添加通知到容器
    notificationContainer.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.classList.add('fadeout');
        setTimeout(() => {
            notification.remove();
            
            // 如果容器内没有通知了，移除容器
            if (notificationContainer.children.length === 0) {
                notificationContainer.remove();
            }
        }, 300);
    }, 3000);
    
    // 添加到状态管理
    AppState.notifications.push({
        id: Date.now(),
        message,
        type,
        timestamp: new Date()
    });
}

/**
 * 模拟数据加载过程
 */
function simulateDataLoading() {
    // 这里可以使用fetch或axios等进行实际API请求
    // 为演示目的，我们使用setTimeout模拟网络请求延迟
    
    setTimeout(() => {
        console.log('系统数据加载完成');
        
        // 加载用户界面数据(如果当前是用户界面)
        if (AppState.currentInterface === 'user') {
            // 触发用户界面初始化
            if (window.initUserInterface) {
                window.initUserInterface();
            }
        }
        
        // 初始化地图
        if (window.initializeMaps) {
            window.initializeMaps();
        }
    }, CONFIG.DEMO_DELAY);
}

// 导出全局访问对象
window.AppState = AppState;
window.CONFIG = CONFIG;
window.showNotification = showNotification;
window.switchInterface = switchInterface;
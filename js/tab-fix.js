/**
 * 智送系统 - 管理端标签切换修复脚本
 * 修复管理界面左侧导航项切换功能
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('管理端标签切换修复脚本已加载');
    setupAdminTabSwitching();
    // 初始化管理端各标签内容
    initAdminTabContents();
});

// 设置管理端标签切换功能
function setupAdminTabSwitching() {
    // 获取所有管理端导航链接
    const adminNavLinks = document.querySelectorAll('.admin-nav a');
    if (!adminNavLinks.length) {
        console.log('未找到管理端导航链接，可能管理端界面尚未加载');
        
        // 设置一个MutationObserver来监听DOM变化
        setupAdminTabObserver();
        return;
    }
    
    console.log(`找到${adminNavLinks.length}个管理端导航链接`);
    
    // 为每个导航链接绑定点击事件
    adminNavLinks.forEach(link => {
        // 移除可能存在的旧事件（通过克隆元素）
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
        
        // 添加新的点击事件
        newLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 获取目标标签
            const targetTab = this.getAttribute('data-tab');
            if (!targetTab) return;
            
            console.log(`切换到管理端标签: ${targetTab}`);
            
            // 更新活动链接样式
            adminNavLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');
            
            // 隐藏所有标签内容
            const tabContents = document.querySelectorAll('.admin-content .tab-content');
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.classList.add('hidden');
            });
            
            // 显示目标标签内容
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.remove('hidden');
                targetContent.classList.add('active');
                
                // 如果标签内有地图，刷新地图大小
                const mapContainer = targetContent.querySelector('.map-container');
                if (mapContainer && window.mapInstances) {
                    const mapId = mapContainer.id;
                    if (window.mapInstances[mapId]) {
                        setTimeout(() => {
                            window.mapInstances[mapId].resize();
                        }, 100);
                    }
                }
            }
        });
    });
    
    console.log('管理端标签切换功能修复完成');
}

// 设置观察者以处理延迟加载的管理端界面
function setupAdminTabObserver() {
    console.log('设置管理端界面观察者');
    
    // 选择要观察变动的节点
    const targetNode = document.querySelector('.main-content');
    if (!targetNode) return;
    
    // 观察器的配置
    const config = { childList: true, subtree: true };
    
    // 当观察到变动时执行的回调函数
    const callback = function(mutationsList, observer) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                // 检查是否管理界面变为可见
                const adminInterface = document.getElementById('admin-interface');
                if (adminInterface && !adminInterface.classList.contains('hidden')) {
                    // 检查是否已存在管理导航链接
                    const adminNavLinks = document.querySelectorAll('.admin-nav a');
                    if (adminNavLinks.length) {
                        console.log('检测到管理界面显示，设置标签切换');
                        setupAdminTabSwitching();
                        
                        // 初始化管理端标签内容
                        initAdminTabContents();
                        
                        // 初始化已激活的标签
                        const activeLink = document.querySelector('.admin-nav a.active');
                        if (activeLink) {
                            // 模拟点击已激活的链接以正确显示内容
                            activeLink.click();
                        } else if (adminNavLinks[0]) {
                            // 如果没有激活的链接，激活第一个
                            adminNavLinks[0].click();
                        }
                        
                        // 停止观察
                        observer.disconnect();
                        break;
                    }
                }
            }
        }
    };
    
    // 创建一个观察器实例并传入回调函数
    const observer = new MutationObserver(callback);
    
    // 以上述配置开始观察目标节点
    observer.observe(targetNode, config);
}

// 当切换到管理端时，确保设置好标签切换功能
document.addEventListener('mapNeedsInit', function(e) {
    if (e.detail && e.detail.interfaceId === 'admin') {
        console.log('检测到切换到管理端界面');
        setTimeout(() => {
            setupAdminTabSwitching();
            // 初始化管理端标签内容
            initAdminTabContents();
        }, 100);
    }
});

// 初始化管理端各标签内容
function initAdminTabContents() {
    // 获取管理端内容容器
    const adminContent = document.querySelector('.admin-content');
    if (!adminContent) return;
    
    // 检查是否已初始化
    if (adminContent.getAttribute('data-initialized') === 'true') return;
    
    // 检查各个标签内容是否存在，如果不存在则创建
    const tabIds = ['overview', 'orders', 'drivers', 'settings'];
    
    tabIds.forEach(tabId => {
        let tabContent = document.getElementById(tabId);
        
        // 如果标签内容不存在，创建一个基本内容
        if (!tabContent) {
            tabContent = document.createElement('div');
            tabContent.id = tabId;
            tabContent.className = 'tab-content hidden';
            
            // 根据不同标签创建不同内容
            switch(tabId) {
                case 'overview': 
                    // 总览已有内容，不需要修改
                    break;
                case 'orders':
                    tabContent.innerHTML = `
                        <h2>订单管理</h2>
                        <div class="filter-toolbar">
                            <input type="text" class="filter-input" placeholder="搜索订单...">
                            <select class="filter-input">
                                <option value="all">所有状态</option>
                                <option value="pending">待处理</option>
                                <option value="processing">配送中</option>
                                <option value="completed">已完成</option>
                                <option value="cancelled">已取消</option>
                            </select>
                            <button class="primary-btn">搜索</button>
                        </div>
                        <table class="order-table">
                            <thead>
                                <tr>
                                    <th>订单编号</th>
                                    <th>客户</th>
                                    <th>下单时间</th>
                                    <th>配送地址</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>ORD-20250421-001</td>
                                    <td>张先生</td>
                                    <td>2025-04-21 08:30</td>
                                    <td>东营市东城区黄河路123号</td>
                                    <td><span class="status-badge pending">待分配</span></td>
                                    <td>
                                        <button class="small-btn">分配车辆</button>
                                        <button class="small-btn">详情</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>ORD-20250421-002</td>
                                    <td>李女士</td>
                                    <td>2025-04-21 09:15</td>
                                    <td>东营市西城区运河路456号</td>
                                    <td><span class="status-badge processing">配送中</span></td>
                                    <td>
                                        <button class="small-btn">追踪</button>
                                        <button class="small-btn">详情</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>ORD-20250421-003</td>
                                    <td>王经理</td>
                                    <td>2025-04-21 10:20</td>
                                    <td>东营市东城区济南路789号</td>
                                    <td><span class="status-badge completed">已完成</span></td>
                                    <td>
                                        <button class="small-btn">查看评价</button>
                                        <button class="small-btn">详情</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="pagination">
                            <button class="page-btn">上一页</button>
                            <span class="page-info">第1页 / 共5页</span>
                            <button class="page-btn">下一页</button>
                        </div>
                    `;
                    break;
                case 'drivers':
                    tabContent.innerHTML = `
                        <h2>司机管理</h2>
                        <div class="filter-toolbar">
                            <input type="text" class="filter-input" placeholder="搜索司机...">
                            <select class="filter-input">
                                <option value="all">所有状态</option>
                                <option value="online">在线</option>
                                <option value="offline">离线</option>
                                <option value="busy">忙碌</option>
                            </select>
                            <button class="primary-btn">搜索</button>
                        </div>
                        <div class="driver-grid">
                            <!-- 司机卡片 -->
                            <div class="driver-card">
                                <div class="driver-status-indicator online"></div>
                                <div class="driver-name">张师傅</div>
                                <div class="driver-car">鲁B·12345 | 小型货车</div>
                                <div class="driver-contact">133****1234</div>
                                <div class="driver-stats">
                                    <div class="stat-item">
                                        <div class="stat-value">128</div>
                                        <div class="stat-label">总订单</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">4.8</div>
                                        <div class="stat-label">评分</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">在线</div>
                                        <div class="stat-label">状态</div>
                                    </div>
                                </div>
                                <div class="driver-actions">
                                    <button class="small-btn">查看</button>
                                    <button class="small-btn">联系</button>
                                </div>
                            </div>
                            <!-- 更多司机卡片 -->
                            <div class="driver-card">
                                <div class="driver-status-indicator online"></div>
                                <div class="driver-name">李师傅</div>
                                <div class="driver-car">鲁B·23456 | 中型货车</div>
                                <div class="driver-contact">135****5678</div>
                                <div class="driver-stats">
                                    <div class="stat-item">
                                        <div class="stat-value">95</div>
                                        <div class="stat-label">总订单</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">4.7</div>
                                        <div class="stat-label">评分</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">在线</div>
                                        <div class="stat-label">状态</div>
                                    </div>
                                </div>
                                <div class="driver-actions">
                                    <button class="small-btn">查看</button>
                                    <button class="small-btn">联系</button>
                                </div>
                            </div>
                            <div class="driver-card">
                                <div class="driver-status-indicator offline"></div>
                                <div class="driver-name">王师傅</div>
                                <div class="driver-car">鲁B·34567 | 小型货车</div>
                                <div class="driver-contact">137****9012</div>
                                <div class="driver-stats">
                                    <div class="stat-item">
                                        <div class="stat-value">76</div>
                                        <div class="stat-label">总订单</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">4.6</div>
                                        <div class="stat-label">评分</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">离线</div>
                                        <div class="stat-label">状态</div>
                                    </div>
                                </div>
                                <div class="driver-actions">
                                    <button class="small-btn">查看</button>
                                    <button class="small-btn">联系</button>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                case 'settings':
                    tabContent.innerHTML = `
                        <h2>系统设置</h2>
                        <div class="settings-card">
                            <h3>基本设置</h3>
                            <div class="settings-group">
                                <div class="setting-item">
                                    <div class="setting-label">系统名称</div>
                                    <input type="text" value="智送城市货运智能调度系统">
                                </div>
                                <div class="setting-item">
                                    <div class="setting-label">联系电话</div>
                                    <input type="text" value="400-123-4567">
                                </div>
                                <div class="setting-item">
                                    <div class="setting-label">客服邮箱</div>
                                    <input type="text" value="support@zhisong.com">
                                </div>
                            </div>
                        </div>
                        <div class="settings-card">
                            <h3>订单设置</h3>
                            <div class="settings-group">
                                <div class="setting-item">
                                    <div class="setting-label">自动分配订单</div>
                                    <label class="switch">
                                        <input type="checkbox" checked>
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="setting-item">
                                    <div class="setting-label">接单超时时间(秒)</div>
                                    <input type="number" value="60">
                                </div>
                                <div class="setting-item">
                                    <div class="setting-label">默认服务半径(公里)</div>
                                    <input type="number" value="5">
                                </div>
                            </div>
                        </div>
                        <div class="settings-card">
                            <h3>通知设置</h3>
                            <div class="settings-group">
                                <div class="setting-item">
                                    <div class="setting-label">启用订单通知</div>
                                    <label class="switch">
                                        <input type="checkbox" checked>
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="setting-item">
                                    <div class="setting-label">启用司机状态变更通知</div>
                                    <label class="switch">
                                        <input type="checkbox" checked>
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="setting-item">
                                    <div class="setting-label">启用系统警报</div>
                                    <label class="switch">
                                        <input type="checkbox" checked>
                                        <span class="slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div style="margin: 20px 0;">
                            <button class="primary-btn" id="save-settings">保存设置</button>
                            <button class="secondary-btn" style="margin-left: 10px;">重置</button>
                        </div>
                    `;
                    break;
            }
            
            adminContent.appendChild(tabContent);
        }
    });
    
    // 标记为已初始化
    adminContent.setAttribute('data-initialized', 'true');
    
    // 激活默认标签
    const activeLink = document.querySelector('.admin-nav a.active');
    if (activeLink) {
        activeLink.click();
    } else {
        const firstLink = document.querySelector('.admin-nav a');
        if (firstLink) firstLink.click();
    }
}
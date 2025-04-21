/**
 * 智送城市货运智能调度系统 - 管理界面逻辑
 * 负责订单监控、车辆管理、数据统计与系统配置
 */

// 管理界面状态
const AdminState = {
    // 当前查看的视图: 'overview'(总览), 'orders'(订单), 'vehicles'(车辆), 'stats'(统计), 'settings'(设置)
    currentView: 'overview',
    // 数据筛选条件
    filters: {
        orderStatus: 'all',
        dateRange: 'today',
        vehicleType: 'all',
        area: 'all'
    },
    // 数据排序方式
    sorting: {
        field: 'time',
        direction: 'desc'
    },
    // 订单数据
    orders: [],
    // 车辆数据
    vehicles: [],
    // 系统参数
    settings: {
        // 调度算法参数
        dispatching: {
            maxRadius: 5,        // 搜索半径(公里)
            weightDistance: 0.6,  // 距离权重
            weightRating: 0.3,    // 评分权重
            weightLoad: 0.1,      // 负载均衡权重
            urgentPriority: 2     // 加急订单优先级倍数
        },
        // 价格计算参数
        pricing: {
            basePrice: 15,        // 基础价格(元)
            perKilometer: 2,      // 每公里价格(元)
            mediumCargo: 10,      // 中型货物加价(元)
            largeCargo: 25,       // 大型货物加价(元)
            urgentFee: 10         // 加急费(元)
        }
    },
    // 统计数据
    statistics: {
        today: {
            orderCount: 0,
            completedOrders: 0,
            totalIncome: 0,
            avgResponseTime: 0
        },
        week: {
            dailyOrders: [],
            dailyIncome: [],
            orderTypes: {
                small: 0,
                medium: 0,
                large: 0
            },
            peakHours: []
        }
    },
    // 系统告警
    alerts: []
};

/**
 * 初始化管理界面
 */
function initAdminInterface() {
    console.log('初始化管理界面');
    
    // 加载导航事件
    setupNavigationEvents();
    
    // 加载订单数据
    loadOrderData();
    
    // 加载车辆数据
    loadVehicleData();
    
    // 加载统计数据
    loadStatistics();
    
    // 设置表单事件
    setupFormEvents();
    
    // 初始化实时监控
    initRealTimeMonitoring();
    
    // 加载告警信息
    loadSystemAlerts();
}

/**
 * 设置导航事件监听
 */
function setupNavigationEvents() {
    // 获取所有导航链接
    const navLinks = document.querySelectorAll('.admin-nav a');
    
    // 为每个导航链接添加点击事件
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 获取视图ID
            const viewId = link.getAttribute('data-view');
            if (!viewId) return;
            
            // 切换视图
            switchView(viewId);
        });
    });
    
    // 初始化默认视图
    switchView('overview');
}

/**
 * 切换管理界面视图
 * @param {string} viewId - 视图ID
 */
function switchView(viewId) {
    // 更新当前视图状态
    AdminState.currentView = viewId;
    
    // 更新导航链接样式
    const navLinks = document.querySelectorAll('.admin-nav a');
    navLinks.forEach(link => {
        if (link.getAttribute('data-view') === viewId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // 隐藏所有视图内容
    const viewContainers = document.querySelectorAll('.admin-view');
    viewContainers.forEach(container => {
        container.classList.add('hidden');
    });
    
    // 显示当前视图
    const currentViewContainer = document.getElementById(`${viewId}-view`);
    if (currentViewContainer) {
        currentViewContainer.classList.remove('hidden');
    }
    
    // 根据视图类型执行特定操作
    switch (viewId) {
        case 'overview':
            renderOverviewDashboard();
            break;
        case 'orders':
            renderOrdersTable();
            break;
        case 'vehicles':
            renderVehiclesMap();
            break;
        case 'stats':
            renderStatisticsCharts();
            break;
        case 'settings':
            renderSettingsForm();
            break;
    }
}

/**
 * 加载订单数据
 */
function loadOrderData() {
    // 在实际应用中，这里会从API获取数据
    // 这里使用模拟数据
    simulateServerRequest('admin/orders', {
        filters: AdminState.filters,
        sorting: AdminState.sorting
    })
    .then(data => {
        AdminState.orders = data;
        
        // 如果当前视图是订单或总览，更新显示
        if (['overview', 'orders'].includes(AdminState.currentView)) {
            if (AdminState.currentView === 'overview') {
                updateOrderSummary();
            } else {
                renderOrdersTable();
            }
        }
    });
}

/**
 * 加载车辆数据
 */
function loadVehicleData() {
    // 在实际应用中，这里会从API获取数据
    // 这里使用模拟数据
    simulateServerRequest('admin/vehicles', {
        filters: AdminState.filters
    })
    .then(data => {
        AdminState.vehicles = data;
        
        // 如果当前视图是车辆或总览，更新显示
        if (['overview', 'vehicles'].includes(AdminState.currentView)) {
            if (AdminState.currentView === 'overview') {
                updateVehicleSummary();
            } else {
                renderVehiclesMap();
            }
        }
    });
}

/**
 * 加载统计数据
 */
function loadStatistics() {
    // 在实际应用中，这里会从API获取数据
    // 这里使用模拟数据
    simulateServerRequest('admin/statistics')
    .then(data => {
        AdminState.statistics = data;
        
        // 如果当前视图是统计或总览，更新显示
        if (['overview', 'stats'].includes(AdminState.currentView)) {
            if (AdminState.currentView === 'overview') {
                updateStatisticsSummary();
            } else {
                renderStatisticsCharts();
            }
        }
    });
}

/**
 * 加载系统告警
 */
function loadSystemAlerts() {
    // 在实际应用中，这里会从API获取数据
    // 这里使用模拟数据
    simulateServerRequest('admin/alerts')
    .then(data => {
        AdminState.alerts = data;
        
        // 显示警告通知
        renderAlertNotifications();
    });
}

/**
 * 设置表单事件
 */
function setupFormEvents() {
    // 订单过滤表单
    const orderFilterForm = document.getElementById('order-filter-form');
    if (orderFilterForm) {
        orderFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 获取筛选条件
            const statusSelect = document.getElementById('filter-status');
            const dateRangeSelect = document.getElementById('filter-date');
            
            AdminState.filters.orderStatus = statusSelect ? statusSelect.value : 'all';
            AdminState.filters.dateRange = dateRangeSelect ? dateRangeSelect.value : 'today';
            
            // 重新加载订单数据
            loadOrderData();
        });
    }
    
    // 车辆过滤表单
    const vehicleFilterForm = document.getElementById('vehicle-filter-form');
    if (vehicleFilterForm) {
        vehicleFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 获取筛选条件
            const typeSelect = document.getElementById('filter-vehicle-type');
            const areaSelect = document.getElementById('filter-area');
            
            AdminState.filters.vehicleType = typeSelect ? typeSelect.value : 'all';
            AdminState.filters.area = areaSelect ? areaSelect.value : 'all';
            
            // 重新加载车辆数据
            loadVehicleData();
        });
    }
    
    // 系统设置表单
    const settingsForm = document.getElementById('system-settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 获取调度算法参数
            const maxRadius = document.getElementById('setting-max-radius');
            const weightDistance = document.getElementById('setting-weight-distance');
            const weightRating = document.getElementById('setting-weight-rating');
            const weightLoad = document.getElementById('setting-weight-load');
            const urgentPriority = document.getElementById('setting-urgent-priority');
            
            // 获取价格计算参数
            const basePrice = document.getElementById('setting-base-price');
            const perKilometer = document.getElementById('setting-per-kilometer');
            const mediumCargo = document.getElementById('setting-medium-cargo');
            const largeCargo = document.getElementById('setting-large-cargo');
            const urgentFee = document.getElementById('setting-urgent-fee');
            
            // 更新设置
            if (maxRadius) AdminState.settings.dispatching.maxRadius = parseFloat(maxRadius.value);
            if (weightDistance) AdminState.settings.dispatching.weightDistance = parseFloat(weightDistance.value);
            if (weightRating) AdminState.settings.dispatching.weightRating = parseFloat(weightRating.value);
            if (weightLoad) AdminState.settings.dispatching.weightLoad = parseFloat(weightLoad.value);
            if (urgentPriority) AdminState.settings.dispatching.urgentPriority = parseFloat(urgentPriority.value);
            
            if (basePrice) AdminState.settings.pricing.basePrice = parseFloat(basePrice.value);
            if (perKilometer) AdminState.settings.pricing.perKilometer = parseFloat(perKilometer.value);
            if (mediumCargo) AdminState.settings.pricing.mediumCargo = parseFloat(mediumCargo.value);
            if (largeCargo) AdminState.settings.pricing.largeCargo = parseFloat(largeCargo.value);
            if (urgentFee) AdminState.settings.pricing.urgentFee = parseFloat(urgentFee.value);
            
            // 保存设置
            saveSystemSettings();
        });
    }
}

/**
 * 初始化实时监控
 */
function initRealTimeMonitoring() {
    // 在实际应用中，这里会使用WebSocket或轮询来获取实时更新
    
    // 模拟实时数据更新
    setInterval(() => {
        // 随机更新订单状态
        if (AdminState.orders.length > 0) {
            const randomIndex = Math.floor(Math.random() * AdminState.orders.length);
            const order = AdminState.orders[randomIndex];
            
            // 随机更新订单状态
            if (order.status === 'pending') {
                order.status = 'in-progress';
                order.assignedVehicle = getRandomVehicle();
                order.updatedAt = new Date();
                
                // 如果当前在查看订单，更新显示
                if (['overview', 'orders'].includes(AdminState.currentView)) {
                    if (AdminState.currentView === 'orders') {
                        updateOrderRow(order);
                    } else {
                        updateOrderSummary();
                    }
                }
                
                // 显示订单更新通知
                showNotification(`订单 ${order.id} 已分配车辆`, 'info');
            } else if (order.status === 'in-progress' && Math.random() < 0.3) {
                order.status = 'completed';
                order.completedAt = new Date();
                
                // 如果当前在查看订单，更新显示
                if (['overview', 'orders'].includes(AdminState.currentView)) {
                    if (AdminState.currentView === 'orders') {
                        updateOrderRow(order);
                    } else {
                        updateOrderSummary();
                    }
                }
                
                // 显示订单完成通知
                showNotification(`订单 ${order.id} 已完成`, 'success');
            }
        }
        
        // 随机更新车辆位置
        if (AdminState.vehicles.length > 0) {
            const randomVehicle = AdminState.vehicles[Math.floor(Math.random() * AdminState.vehicles.length)];
            
            // 随机小幅移动位置
            randomVehicle.position = [
                randomVehicle.position[0] + (Math.random() - 0.5) * 0.01,
                randomVehicle.position[1] + (Math.random() - 0.5) * 0.01
            ];
            
            // 如果当前在查看车辆，更新地图
            if (AdminState.currentView === 'vehicles') {
                updateVehicleMarker(randomVehicle);
            }
        }
        
        // 随机添加系统告警
        if (Math.random() < 0.1) {
            generateRandomAlert();
        }
    }, 15000);
}

/**
 * 渲染总览仪表盘
 */
function renderOverviewDashboard() {
    // 更新订单摘要
    updateOrderSummary();
    
    // 更新车辆摘要
    updateVehicleSummary();
    
    // 更新统计摘要
    updateStatisticsSummary();
    
    // 初始化地图
    initOverviewMap();
}

/**
 * 更新订单摘要
 */
function updateOrderSummary() {
    // 计算各状态订单数量
    const pendingCount = AdminState.orders.filter(o => o.status === 'pending').length;
    const inProgressCount = AdminState.orders.filter(o => o.status === 'in-progress').length;
    const completedCount = AdminState.orders.filter(o => o.status === 'completed').length;
    const totalCount = AdminState.orders.length;
    
    // 更新DOM
    const pendingElement = document.getElementById('pending-orders-count');
    const inProgressElement = document.getElementById('in-progress-orders-count');
    const completedElement = document.getElementById('completed-orders-count');
    const totalElement = document.getElementById('total-orders-count');
    
    if (pendingElement) pendingElement.textContent = pendingCount;
    if (inProgressElement) inProgressElement.textContent = inProgressCount;
    if (completedElement) completedElement.textContent = completedCount;
    if (totalElement) totalElement.textContent = totalCount;
    
    // 更新最近订单表格
    updateRecentOrdersTable();
}

/**
 * 更新最近订单表格
 */
function updateRecentOrdersTable() {
    const recentOrdersTable = document.getElementById('recent-orders-table');
    if (!recentOrdersTable) return;
    
    // 获取最近10个订单
    const recentOrders = [...AdminState.orders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);
    
    // 生成表格内容
    const tableContent = recentOrders.map(order => `
        <tr class="order-row ${order.status}">
            <td>${order.id}</td>
            <td>${formatDateTime(order.createdAt)}</td>
            <td>${getOrderStatusText(order.status)}</td>
            <td>${order.pickupAddress.substring(0, 15)}...</td>
            <td>${order.deliveryAddress.substring(0, 15)}...</td>
            <td>${order.assignedVehicle || '-'}</td>
            <td>
                <button class="action-btn view-btn" data-order-id="${order.id}">
                    <i class="fa fa-eye"></i>
                </button>
                ${order.status === 'pending' ? `
                <button class="action-btn assign-btn" data-order-id="${order.id}">
                    <i class="fa fa-truck"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
    
    // 更新表格
    const tableBody = recentOrdersTable.querySelector('tbody');
    if (tableBody) {
        tableBody.innerHTML = tableContent;
        
        // 绑定事件
        tableBody.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.getAttribute('data-order-id');
                viewOrderDetails(orderId);
            });
        });
        
        tableBody.querySelectorAll('.assign-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.getAttribute('data-order-id');
                showAssignVehicleDialog(orderId);
            });
        });
    }
}

/**
 * 更新车辆摘要
 */
function updateVehicleSummary() {
    // 计算各状态车辆数量
    const availableCount = AdminState.vehicles.filter(v => v.status === 'available').length;
    const busyCount = AdminState.vehicles.filter(v => v.status === 'busy').length;
    const offlineCount = AdminState.vehicles.filter(v => v.status === 'offline').length;
    const totalCount = AdminState.vehicles.length;
    
    // 更新DOM
    const availableElement = document.getElementById('available-vehicles-count');
    const busyElement = document.getElementById('busy-vehicles-count');
    const offlineElement = document.getElementById('offline-vehicles-count');
    const totalElement = document.getElementById('total-vehicles-count');
    
    if (availableElement) availableElement.textContent = availableCount;
    if (busyElement) busyElement.textContent = busyCount;
    if (offlineElement) offlineElement.textContent = offlineCount;
    if (totalElement) totalElement.textContent = totalCount;
}

/**
 * 更新统计摘要
 */
function updateStatisticsSummary() {
    // 获取今日统计数据
    const { orderCount, completedOrders, totalIncome, avgResponseTime } = AdminState.statistics.today;
    
    // 更新DOM
    const orderCountElement = document.getElementById('today-order-count');
    const completedOrdersElement = document.getElementById('today-completed-orders');
    const totalIncomeElement = document.getElementById('today-total-income');
    const avgResponseTimeElement = document.getElementById('today-avg-response-time');
    
    if (orderCountElement) orderCountElement.textContent = orderCount;
    if (completedOrdersElement) completedOrdersElement.textContent = completedOrders;
    if (totalIncomeElement) totalIncomeElement.textContent = `¥${totalIncome.toFixed(2)}`;
    if (avgResponseTimeElement) avgResponseTimeElement.textContent = `${avgResponseTime}分钟`;
    
    // 如果图表容器存在，绘制小型图表
    renderMiniCharts();
}

/**
 * 绘制迷你图表
 */
function renderMiniCharts() {
    // 在实际应用中，这里会使用Chart.js或ECharts等图表库
    // 这里仅作为占位符
    const miniChartContainer = document.getElementById('mini-order-chart');
    if (miniChartContainer) {
        miniChartContainer.innerHTML = `
            <div class="chart-placeholder">
                <div class="chart-bar" style="height: 30%"></div>
                <div class="chart-bar" style="height: 50%"></div>
                <div class="chart-bar" style="height: 40%"></div>
                <div class="chart-bar" style="height: 70%"></div>
                <div class="chart-bar" style="height: 60%"></div>
                <div class="chart-bar" style="height: 80%"></div>
                <div class="chart-bar" style="height: 65%"></div>
            </div>
        `;
    }
    
    const miniIncomeChartContainer = document.getElementById('mini-income-chart');
    if (miniIncomeChartContainer) {
        miniIncomeChartContainer.innerHTML = `
            <div class="chart-placeholder">
                <div class="chart-line" style="height: 40%"></div>
                <div class="chart-line" style="height: 35%"></div>
                <div class="chart-line" style="height: 50%"></div>
                <div class="chart-line" style="height: 60%"></div>
                <div class="chart-line" style="height: 55%"></div>
                <div class="chart-line" style="height: 70%"></div>
                <div class="chart-line" style="height: 75%"></div>
            </div>
        `;
    }
}

/**
 * 初始化总览地图
 */
function initOverviewMap() {
    const overviewMapContainer = document.getElementById('overview-map');
    if (!overviewMapContainer || !window.mapInstances) return;
    
    // 获取地图实例
    const adminMap = window.mapInstances['admin-map'];
    if (!adminMap) return;
    
    // 清除现有标记
    if (window.clearMapMarkers) {
        window.clearMapMarkers('admin');
    }
    
    // 添加车辆标记
    AdminState.vehicles.forEach(vehicle => {
        if (window.addVehicleMarker) {
            window.addVehicleMarker(adminMap, {
                id: vehicle.id,
                position: vehicle.position,
                status: vehicle.status,
                title: `${vehicle.id} - ${getVehicleStatusText(vehicle.status)}`
            });
        }
    });
    
    // 添加订单标记
    const pendingOrders = AdminState.orders.filter(o => o.status === 'pending');
    pendingOrders.forEach(order => {
        // 添加取货点标记
        if (window.addOrderMarker) {
            window.addOrderMarker(adminMap, {
                id: `pickup-${order.id}`,
                position: order.pickupPosition,
                title: `取: ${order.pickupAddress}`,
                type: 'pickup',
                size: 'small'
            });
            
            // 添加送货点标记
            window.addOrderMarker(adminMap, {
                id: `delivery-${order.id}`,
                position: order.deliveryPosition,
                title: `送: ${order.deliveryAddress}`,
                type: 'delivery',
                size: 'small'
            });
        }
    });
}

/**
 * 渲染订单表格
 */
function renderOrdersTable() {
    const ordersTable = document.getElementById('orders-table');
    if (!ordersTable) return;
    
    // 排序订单
    const sortedOrders = [...AdminState.orders].sort((a, b) => {
        const field = AdminState.sorting.field;
        const direction = AdminState.sorting.direction === 'asc' ? 1 : -1;
        
        if (field === 'time') {
            return direction * (new Date(b.createdAt) - new Date(a.createdAt));
        } else if (field === 'status') {
            return direction * (a.status.localeCompare(b.status));
        }
        
        return 0;
    });
    
    // 生成表格内容
    const tableContent = sortedOrders.map(order => `
        <tr class="order-row ${order.status}" data-order-id="${order.id}">
            <td>${order.id}</td>
            <td>${formatDateTime(order.createdAt)}</td>
            <td><span class="status-badge ${order.status}">${getOrderStatusText(order.status)}</span></td>
            <td>${order.customerName}</td>
            <td>${order.pickupAddress.substring(0, 20)}...</td>
            <td>${order.deliveryAddress.substring(0, 20)}...</td>
            <td>${order.cargoType}</td>
            <td>¥${order.price.toFixed(2)}</td>
            <td>${order.assignedVehicle || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" title="查看详情">
                        <i class="fa fa-eye"></i>
                    </button>
                    ${order.status === 'pending' ? `
                    <button class="action-btn assign-btn" title="分配车辆">
                        <i class="fa fa-truck"></i>
                    </button>
                    ` : ''}
                    ${order.status === 'in-progress' ? `
                    <button class="action-btn track-btn" title="跟踪订单">
                        <i class="fa fa-map-marker"></i>
                    </button>
                    ` : ''}
                    <button class="action-btn delete-btn" title="删除订单">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // 更新表格
    const tableBody = ordersTable.querySelector('tbody');
    if (tableBody) {
        tableBody.innerHTML = tableContent;
        
        // 绑定事件
        tableBody.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.closest('tr').getAttribute('data-order-id');
                viewOrderDetails(orderId);
            });
        });
        
        tableBody.querySelectorAll('.assign-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.closest('tr').getAttribute('data-order-id');
                showAssignVehicleDialog(orderId);
            });
        });
        
        tableBody.querySelectorAll('.track-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.closest('tr').getAttribute('data-order-id');
                trackOrder(orderId);
            });
        });
        
        tableBody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.closest('tr').getAttribute('data-order-id');
                deleteOrder(orderId);
            });
        });
    }
    
    // 设置表头排序事件
    const tableHeaders = ordersTable.querySelectorAll('thead th[data-sort]');
    tableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const field = header.getAttribute('data-sort');
            
            // 切换排序方向
            if (AdminState.sorting.field === field) {
                AdminState.sorting.direction = AdminState.sorting.direction === 'asc' ? 'desc' : 'asc';
            } else {
                AdminState.sorting.field = field;
                AdminState.sorting.direction = 'desc';
            }
            
            // 更新表头样式
            tableHeaders.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
            header.classList.add(`sort-${AdminState.sorting.direction}`);
            
            // 重新渲染表格
            renderOrdersTable();
        });
        
        // 设置初始排序样式
        if (AdminState.sorting.field === header.getAttribute('data-sort')) {
            header.classList.add(`sort-${AdminState.sorting.direction}`);
        }
    });
}

/**
 * 更新单个订单行
 * @param {Object} order - 订单数据
 */
function updateOrderRow(order) {
    const orderRow = document.querySelector(`tr[data-order-id="${order.id}"]`);
    if (!orderRow) return;
    
    // 更新状态类
    orderRow.className = `order-row ${order.status}`;
    
    // 更新状态单元格
    const statusCell = orderRow.querySelector('td:nth-child(3)');
    if (statusCell) {
        statusCell.innerHTML = `<span class="status-badge ${order.status}">${getOrderStatusText(order.status)}</span>`;
    }
    
    // 更新分配车辆单元格
    const vehicleCell = orderRow.querySelector('td:nth-child(9)');
    if (vehicleCell) {
        vehicleCell.textContent = order.assignedVehicle || '-';
    }
    
    // 更新操作按钮
    const actionsCell = orderRow.querySelector('td:last-child .action-buttons');
    if (actionsCell) {
        // 根据订单状态更新可用操作
        if (order.status === 'pending') {
            // 添加分配按钮（如果不存在）
            if (!actionsCell.querySelector('.assign-btn')) {
                const assignBtn = document.createElement('button');
                assignBtn.className = 'action-btn assign-btn';
                assignBtn.title = '分配车辆';
                assignBtn.innerHTML = '<i class="fa fa-truck"></i>';
                assignBtn.addEventListener('click', () => {
                    showAssignVehicleDialog(order.id);
                });
                
                // 插入到查看按钮后面
                const viewBtn = actionsCell.querySelector('.view-btn');
                if (viewBtn) {
                    viewBtn.insertAdjacentElement('afterend', assignBtn);
                } else {
                    actionsCell.prepend(assignBtn);
                }
            }
            
            // 移除跟踪按钮
            const trackBtn = actionsCell.querySelector('.track-btn');
            if (trackBtn) {
                trackBtn.remove();
            }
        } else if (order.status === 'in-progress') {
            // 移除分配按钮
            const assignBtn = actionsCell.querySelector('.assign-btn');
            if (assignBtn) {
                assignBtn.remove();
            }
            
            // 添加跟踪按钮（如果不存在）
            if (!actionsCell.querySelector('.track-btn')) {
                const trackBtn = document.createElement('button');
                trackBtn.className = 'action-btn track-btn';
                trackBtn.title = '跟踪订单';
                trackBtn.innerHTML = '<i class="fa fa-map-marker"></i>';
                trackBtn.addEventListener('click', () => {
                    trackOrder(order.id);
                });
                
                // 插入到查看按钮后面
                const viewBtn = actionsCell.querySelector('.view-btn');
                if (viewBtn) {
                    viewBtn.insertAdjacentElement('afterend', trackBtn);
                } else {
                    actionsCell.prepend(trackBtn);
                }
            }
        } else if (order.status === 'completed') {
            // 移除分配和跟踪按钮
            const assignBtn = actionsCell.querySelector('.assign-btn');
            const trackBtn = actionsCell.querySelector('.track-btn');
            if (assignBtn) assignBtn.remove();
            if (trackBtn) trackBtn.remove();
        }
    }
}

/**
 * 渲染车辆地图
 */
function renderVehiclesMap() {
    const vehiclesMapContainer = document.getElementById('vehicles-map');
    if (!vehiclesMapContainer || !window.mapInstances) return;
    
    // 获取地图实例
    const adminMap = window.mapInstances['admin-map'];
    if (!adminMap) return;
    
    // 清除现有标记
    if (window.clearMapMarkers) {
        window.clearMapMarkers('admin');
    }
    
    // 添加所有车辆标记
    AdminState.vehicles.forEach(vehicle => {
        if (window.addVehicleMarker) {
            window.addVehicleMarker(adminMap, {
                id: vehicle.id,
                position: vehicle.position,
                status: vehicle.status,
                title: `${vehicle.id} - ${getVehicleStatusText(vehicle.status)}`
            });
        }
    });
    
    // 显示车辆列表
    renderVehiclesList();
    
    // 添加热力图切换按钮
    const mapControlsContainer = document.getElementById('map-controls');
    if (mapControlsContainer) {
        mapControlsContainer.innerHTML = `
            <div class="map-control-group">
                <button id="toggle-heatmap" class="map-control-btn">
                    <i class="fa fa-fire"></i> 热力图
                </button>
                <button id="toggle-traffic" class="map-control-btn">
                    <i class="fa fa-road"></i> 路况
                </button>
                <button id="fit-all-vehicles" class="map-control-btn">
                    <i class="fa fa-expand"></i> 显示全部
                </button>
            </div>
        `;
        
        // 绑定热力图切换事件
        document.getElementById('toggle-heatmap').addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            btn.classList.toggle('active');
            toggleHeatmap(btn.classList.contains('active'));
        });
        
        // 绑定路况切换事件
        document.getElementById('toggle-traffic').addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            btn.classList.toggle('active');
            toggleTraffic(btn.classList.contains('active'));
        });
        
        // 绑定显示全部车辆事件
        document.getElementById('fit-all-vehicles').addEventListener('click', () => {
            fitMapToAllVehicles();
        });
    }
}

/**
 * 渲染车辆列表
 */
function renderVehiclesList() {
    const vehiclesList = document.getElementById('vehicles-list');
    if (!vehiclesList) return;
    
    // 按状态排序：在线优先，然后是繁忙，最后是离线
    const sortedVehicles = [...AdminState.vehicles].sort((a, b) => {
        const statusOrder = { 'available': 0, 'busy': 1, 'offline': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });
    
    // 生成列表内容
    const listContent = sortedVehicles.map(vehicle => `
        <div class="vehicle-item ${vehicle.status}" data-vehicle-id="${vehicle.id}">
            <div class="vehicle-status-indicator"></div>
            <div class="vehicle-info">
                <div class="vehicle-id">${vehicle.id}</div>
                <div class="vehicle-type">${vehicle.type} | ${getVehicleStatusText(vehicle.status)}</div>
            </div>
            <div class="vehicle-actions">
                <button class="vehicle-action locate-btn" title="定位">
                    <i class="fa fa-crosshairs"></i>
                </button>
                <button class="vehicle-action details-btn" title="详情">
                    <i class="fa fa-info-circle"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // 更新列表
    vehiclesList.innerHTML = listContent;
    
    // 绑定事件
    vehiclesList.querySelectorAll('.locate-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const vehicleId = e.target.closest('.vehicle-item').getAttribute('data-vehicle-id');
            locateVehicle(vehicleId);
        });
    });
    
    vehiclesList.querySelectorAll('.details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const vehicleId = e.target.closest('.vehicle-item').getAttribute('data-vehicle-id');
            viewVehicleDetails(vehicleId);
        });
    });
}

/**
 * 更新车辆标记
 * @param {Object} vehicle - 车辆数据
 */
function updateVehicleMarker(vehicle) {
    // 获取地图实例
    const adminMap = window.mapInstances ? window.mapInstances['admin-map'] : null;
    if (!adminMap) return;
    
    // 获取车辆标记
    const vehicleMarker = window.mapMarkers ? window.mapMarkers.vehicles[vehicle.id] : null;
    
    if (vehicleMarker) {
        // 更新位置
        vehicleMarker.setPosition(vehicle.position);
    } else if (window.addVehicleMarker) {
        // 创建标记
        window.addVehicleMarker(adminMap, {
            id: vehicle.id,
            position: vehicle.position,
            status: vehicle.status,
            title: `${vehicle.id} - ${getVehicleStatusText(vehicle.status)}`
        });
    }
    
    // 更新车辆列表项
    updateVehicleListItem(vehicle);
}

/**
 * 更新车辆列表项
 * @param {Object} vehicle - 车辆数据
 */
function updateVehicleListItem(vehicle) {
    const vehicleItem = document.querySelector(`.vehicle-item[data-vehicle-id="${vehicle.id}"]`);
    if (!vehicleItem) return;
    
    // 更新状态类
    vehicleItem.className = `vehicle-item ${vehicle.status}`;
    
    // 更新车辆类型和状态文本
    const vehicleTypeElement = vehicleItem.querySelector('.vehicle-type');
    if (vehicleTypeElement) {
        vehicleTypeElement.textContent = `${vehicle.type} | ${getVehicleStatusText(vehicle.status)}`;
    }
}

/**
 * 切换热力图显示
 * @param {boolean} show - 是否显示
 */
function toggleHeatmap(show) {
    // 获取地图实例
    const adminMap = window.mapInstances ? window.mapInstances['admin-map'] : null;
    if (!adminMap) return;
    
    // 触发地图热力图切换事件
    const heatmapBtn = adminMap.getContainer().querySelector('.heatmap-btn');
    if (heatmapBtn) {
        // 检查当前状态是否与目标状态不同
        const isCurrentlyActive = heatmapBtn.classList.contains('active');
        if (show !== isCurrentlyActive) {
            // 模拟点击事件
            heatmapBtn.click();
        }
    }
}

/**
 * 切换交通状况显示
 * @param {boolean} show - 是否显示
 */
function toggleTraffic(show) {
    // 获取地图实例
    const adminMap = window.mapInstances ? window.mapInstances['admin-map'] : null;
    if (!adminMap) return;
    
    // 触发地图路况切换事件
    const trafficBtn = adminMap.getContainer().querySelector('.traffic-btn');
    if (trafficBtn) {
        // 检查当前状态是否与目标状态不同
        const isCurrentlyActive = trafficBtn.classList.contains('active');
        if (show !== isCurrentlyActive) {
            // 模拟点击事件
            trafficBtn.click();
        }
    }
}

/**
 * 定位车辆
 * @param {string} vehicleId - 车辆ID
 */
function locateVehicle(vehicleId) {
    // 查找车辆
    const vehicle = AdminState.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    // 获取地图实例
    const adminMap = window.mapInstances ? window.mapInstances['admin-map'] : null;
    if (!adminMap) return;
    
    // 居中显示车辆位置
    adminMap.setZoomAndCenter(15, vehicle.position);
    
    // 高亮显示车辆标记
    const vehicleMarker = window.mapMarkers ? window.mapMarkers.vehicles[vehicleId] : null;
    if (vehicleMarker) {
        // 创建信息窗体
        const infoWindow = new AMap.InfoWindow({
            content: `
                <div class="info-window vehicle-info">
                    <h3>车辆信息</h3>
                    <p>车辆ID: ${vehicle.id}</p>
                    <p>状态: ${getVehicleStatusText(vehicle.status)}</p>
                    <p>类型: ${vehicle.type}</p>
                    ${vehicle.driver ? `<p>司机: ${vehicle.driver}</p>` : ''}
                    ${vehicle.phone ? `<p>联系电话: ${vehicle.phone}</p>` : ''}
                    ${vehicle.lastOrder ? `<p>当前/最近订单: ${vehicle.lastOrder}</p>` : ''}
                </div>
            `,
            offset: new AMap.Pixel(0, -32)
        });
        
        // 打开信息窗体
        infoWindow.open(adminMap, vehicleMarker.getPosition());
    }
    
    // 高亮显示列表项
    const vehicleItems = document.querySelectorAll('.vehicle-item');
    vehicleItems.forEach(item => {
        item.classList.remove('highlighted');
    });
    
    const vehicleItem = document.querySelector(`.vehicle-item[data-vehicle-id="${vehicleId}"]`);
    if (vehicleItem) {
        vehicleItem.classList.add('highlighted');
        vehicleItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * 使地图适应所有车辆
 */
function fitMapToAllVehicles() {
    // 获取地图实例
    const adminMap = window.mapInstances ? window.mapInstances['admin-map'] : null;
    if (!adminMap || AdminState.vehicles.length === 0) return;
    
    // 创建边界对象
    const bounds = new AMap.Bounds();
    
    // 将所有车辆位置添加到边界
    AdminState.vehicles.forEach(vehicle => {
        bounds.extend(vehicle.position);
    });
    
    // 调整地图视野
    adminMap.setBounds(bounds, [50, 50, 50, 50]);
}

/**
 * 查看车辆详情
 * @param {string} vehicleId - 车辆ID
 */
function viewVehicleDetails(vehicleId) {
    // 查找车辆
    const vehicle = AdminState.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    // 创建模态框内容
    const modalContent = `
        <div class="modal-header">
            <h3>车辆详情</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <div class="vehicle-details">
                <div class="detail-row">
                    <div class="detail-label">车辆ID</div>
                    <div class="detail-value">${vehicle.id}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">车辆类型</div>
                    <div class="detail-value">${vehicle.type}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">当前状态</div>
                    <div class="detail-value status-${vehicle.status}">${getVehicleStatusText(vehicle.status)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">司机姓名</div>
                    <div class="detail-value">${vehicle.driver || '未分配'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">联系电话</div>
                    <div class="detail-value">${vehicle.phone || '-'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">载重能力</div>
                    <div class="detail-value">${vehicle.capacity || '-'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">当前/最近订单</div>
                    <div class="detail-value">${vehicle.lastOrder || '无'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">今日完成订单</div>
                    <div class="detail-value">${vehicle.todayOrders || '0'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">总计完成订单</div>
                    <div class="detail-value">${vehicle.totalOrders || '0'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">平均评分</div>
                    <div class="detail-value">${vehicle.rating ? `${vehicle.rating}星` : '-'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">车辆注册时间</div>
                    <div class="detail-value">${vehicle.registeredAt ? formatDate(vehicle.registeredAt) : '-'}</div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="secondary-btn" id="locate-vehicle-btn">在地图中定位</button>
            <button class="primary-btn" id="contact-driver-btn">联系司机</button>
        </div>
    `;
    
    // 显示模态框
    showModal(modalContent, 'vehicle-details-modal');
    
    // 绑定定位按钮事件
    document.getElementById('locate-vehicle-btn').addEventListener('click', () => {
        locateVehicle(vehicleId);
        closeModal();
    });
    
    // 绑定联系司机按钮事件
    document.getElementById('contact-driver-btn').addEventListener('click', () => {
        if (vehicle.phone) {
            alert(`联系司机: ${vehicle.driver}\n电话: ${vehicle.phone}`);
        } else {
            alert('没有司机联系信息');
        }
    });
}

/**
 * 渲染统计图表
 */
function renderStatisticsCharts() {
    // 渲染订单趋势图
    renderOrderTrendChart();
    
    // 渲染收入统计图
    renderIncomeChart();
    
    // 渲染订单类型分布
    renderOrderTypeChart();
    
    // 渲染高峰时段分析
    renderPeakHoursChart();
    
    // 渲染性能指标
    renderPerformanceMetrics();
}

/**
 * 渲染订单趋势图
 */
function renderOrderTrendChart() {
    // 在实际应用中，这里会使用Chart.js或ECharts等图表库
    // 这里仅作为占位符
    const chartContainer = document.getElementById('order-trend-chart');
    if (!chartContainer) return;
    
    // 使用周数据生成图表
    const weekData = AdminState.statistics.week.dailyOrders;
    
    // 简单显示占位图表
    let chartBars = '';
    weekData.forEach(value => {
        const height = Math.max(10, Math.min(90, value / 2));
        chartBars += `<div class="chart-bar" style="height: ${height}%"></div>`;
    });
    
    chartContainer.innerHTML = `
        <div class="chart-placeholder chart-container">
            ${chartBars}
        </div>
        <div class="chart-labels">
            <span>周一</span>
            <span>周二</span>
            <span>周三</span>
            <span>周四</span>
            <span>周五</span>
            <span>周六</span>
            <span>周日</span>
        </div>
    `;
}

/**
 * 渲染收入图表
 */
function renderIncomeChart() {
    const chartContainer = document.getElementById('income-chart');
    if (!chartContainer) return;
    
    // 使用周数据生成图表
    const weekData = AdminState.statistics.week.dailyIncome;
    
    // 简单显示占位图表
    let chartLines = '';
    weekData.forEach(value => {
        const height = Math.max(10, Math.min(90, value / 20));
        chartLines += `<div class="chart-line" style="height: ${height}%"></div>`;
    });
    
    chartContainer.innerHTML = `
        <div class="chart-placeholder chart-container">
            ${chartLines}
        </div>
        <div class="chart-labels">
            <span>周一</span>
            <span>周二</span>
            <span>周三</span>
            <span>周四</span>
            <span>周五</span>
            <span>周六</span>
            <span>周日</span>
        </div>
    `;
}

/**
 * 渲染订单类型图表
 */
function renderOrderTypeChart() {
    const chartContainer = document.getElementById('order-type-chart');
    if (!chartContainer) return;
    
    // 使用订单类型数据
    const { small, medium, large } = AdminState.statistics.week.orderTypes;
    const total = small + medium + large;
    
    // 计算百分比
    const smallPercent = total ? Math.round(small / total * 100) : 0;
    const mediumPercent = total ? Math.round(medium / total * 100) : 0;
    const largePercent = total ? 100 - smallPercent - mediumPercent : 0;
    
    // 创建饼图占位符
    chartContainer.innerHTML = `
        <div class="chart-pie-placeholder">
            <div class="pie-segment small" style="--percent: ${smallPercent}"></div>
            <div class="pie-segment medium" style="--percent: ${mediumPercent}"></div>
            <div class="pie-segment large" style="--percent: ${largePercent}"></div>
        </div>
        <div class="pie-legend">
            <div class="legend-item">
                <span class="legend-color small"></span>
                <span class="legend-text">小件 (${smallPercent}%)</span>
            </div>
            <div class="legend-item">
                <span class="legend-color medium"></span>
                <span class="legend-text">中件 (${mediumPercent}%)</span>
            </div>
            <div class="legend-item">
                <span class="legend-color large"></span>
                <span class="legend-text">大件 (${largePercent}%)</span>
            </div>
        </div>
    `;
}

/**
 * 渲染高峰时段图表
 */
function renderPeakHoursChart() {
    const chartContainer = document.getElementById('peak-hours-chart');
    if (!chartContainer) return;
    
    // 使用高峰时段数据
    const peakHours = AdminState.statistics.week.peakHours;
    
    // 简单显示占位图表
    let chartBars = '';
    peakHours.forEach((count, hour) => {
        if (hour % 2 === 0) { // 只显示偶数小时，减少拥挤
            const height = Math.max(5, Math.min(90, count * 2));
            chartBars += `<div class="chart-bar" style="height: ${height}%" title="${hour}:00 - ${hour+1}:00"></div>`;
        }
    });
    
    chartContainer.innerHTML = `
        <div class="chart-placeholder chart-container">
            ${chartBars}
        </div>
        <div class="chart-labels">
            <span>6:00</span>
            <span>8:00</span>
            <span>10:00</span>
            <span>12:00</span>
            <span>14:00</span>
            <span>16:00</span>
            <span>18:00</span>
            <span>20:00</span>
            <span>22:00</span>
        </div>
    `;
}

/**
 * 渲染性能指标
 */
function renderPerformanceMetrics() {
    const metricsContainer = document.getElementById('performance-metrics');
    if (!metricsContainer) return;
    
    // 获取今日统计数据
    const { orderCount, completedOrders, totalIncome, avgResponseTime } = AdminState.statistics.today;
    
    // 计算完成率
    const completionRate = orderCount > 0 ? Math.round((completedOrders / orderCount) * 100) : 0;
    
    // 计算每单平均收入
    const avgOrderIncome = completedOrders > 0 ? (totalIncome / completedOrders).toFixed(2) : '0.00';
    
    // 更新UI
    metricsContainer.innerHTML = `
        <div class="metric-card">
            <div class="metric-value">${completionRate}%</div>
            <div class="metric-label">订单完成率</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${avgResponseTime}分钟</div>
            <div class="metric-label">平均响应时间</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">¥${avgOrderIncome}</div>
            <div class="metric-label">单均收入</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${AdminState.vehicles.filter(v => v.status === 'available').length}</div>
            <div class="metric-label">可用车辆数</div>
        </div>
    `;
}

/**
 * 渲染设置表单
 */
function renderSettingsForm() {
    const settingsForm = document.getElementById('system-settings-form');
    if (!settingsForm) return;
    
    // 获取当前设置
    const { dispatching, pricing } = AdminState.settings;
    
    // 更新表单值
    const maxRadiusInput = document.getElementById('setting-max-radius');
    const weightDistanceInput = document.getElementById('setting-weight-distance');
    const weightRatingInput = document.getElementById('setting-weight-rating');
    const weightLoadInput = document.getElementById('setting-weight-load');
    const urgentPriorityInput = document.getElementById('setting-urgent-priority');
    
    const basePriceInput = document.getElementById('setting-base-price');
    const perKilometerInput = document.getElementById('setting-per-kilometer');
    const mediumCargoInput = document.getElementById('setting-medium-cargo');
    const largeCargoInput = document.getElementById('setting-large-cargo');
    const urgentFeeInput = document.getElementById('setting-urgent-fee');
    
    // 更新调度参数
    if (maxRadiusInput) maxRadiusInput.value = dispatching.maxRadius;
    if (weightDistanceInput) weightDistanceInput.value = dispatching.weightDistance;
    if (weightRatingInput) weightRatingInput.value = dispatching.weightRating;
    if (weightLoadInput) weightLoadInput.value = dispatching.weightLoad;
    if (urgentPriorityInput) urgentPriorityInput.value = dispatching.urgentPriority;
    
    // 更新价格参数
    if (basePriceInput) basePriceInput.value = pricing.basePrice;
    if (perKilometerInput) perKilometerInput.value = pricing.perKilometer;
    if (mediumCargoInput) mediumCargoInput.value = pricing.mediumCargo;
    if (largeCargoInput) largeCargoInput.value = pricing.largeCargo;
    if (urgentFeeInput) urgentFeeInput.value = pricing.urgentFee;
}

/**
 * 保存系统设置
 */
function saveSystemSettings() {
    // 在实际应用中，这里会发送API请求保存设置
    simulateServerRequest('admin/settings/save', AdminState.settings)
    .then(() => {
        // 显示保存成功通知
        showNotification('系统设置已保存', 'success');
    })
    .catch(() => {
        showNotification('保存失败，请重试', 'error');
    });
}

/**
 * 查看订单详情
 * @param {string} orderId - 订单ID
 */
function viewOrderDetails(orderId) {
    // 查找订单
    const order = AdminState.orders.find(o => o.id === orderId);
    if (!order) return;
    
    // 格式化订单时间
    const createdTime = formatDateTime(order.createdAt);
    const updatedTime = order.updatedAt ? formatDateTime(order.updatedAt) : '-';
    const completedTime = order.completedAt ? formatDateTime(order.completedAt) : '-';
    
    // 创建模态框内容
    const modalContent = `
        <div class="modal-header">
            <h3>订单详情</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <div class="order-details">
                <div class="detail-section">
                    <h4>基本信息</h4>
                    <div class="detail-row">
                        <div class="detail-label">订单编号</div>
                        <div class="detail-value">${order.id}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">创建时间</div>
                        <div class="detail-value">${createdTime}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">当前状态</div>
                        <div class="detail-value status-${order.status}">${getOrderStatusText(order.status)}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">更新时间</div>
                        <div class="detail-value">${updatedTime}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">完成时间</div>
                        <div class="detail-value">${completedTime}</div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>客户信息</h4>
                    <div class="detail-row">
                        <div class="detail-label">客户姓名</div>
                        <div class="detail-value">${order.customerName}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">联系电话</div>
                        <div class="detail-value">${order.customerPhone}</div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>地址信息</h4>
                    <div class="detail-row">
                        <div class="detail-label">取货地址</div>
                        <div class="detail-value">${order.pickupAddress}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">送货地址</div>
                        <div class="detail-value">${order.deliveryAddress}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">预计距离</div>
                        <div class="detail-value">${order.distance} 公里</div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>货物信息</h4>
                    <div class="detail-row">
                        <div class="detail-label">货物类型</div>
                        <div class="detail-value">${order.cargoType}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">重量</div>
                        <div class="detail-value">${order.weight} 公斤</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">尺寸</div>
                        <div class="detail-value">${order.dimensions || '未指定'}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">特殊要求</div>
                        <div class="detail-value">${order.specialRequirements || '无'}</div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>配送信息</h4>
                    <div class="detail-row">
                        <div class="detail-label">分配车辆</div>
                        <div class="detail-value">${order.assignedVehicle || '未分配'}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">预计送达</div>
                        <div class="detail-value">${order.estimatedDelivery ? formatDateTime(order.estimatedDelivery) : '未确定'}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">实际送达</div>
                        <div class="detail-value">${order.actualDelivery ? formatDateTime(order.actualDelivery) : '未送达'}</div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>费用信息</h4>
                    <div class="detail-row">
                        <div class="detail-label">基础费用</div>
                        <div class="detail-value">¥${order.basePrice.toFixed(2)}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">距离费用</div>
                        <div class="detail-value">¥${order.distancePrice.toFixed(2)}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">货物附加费</div>
                        <div class="detail-value">¥${order.cargoPrice.toFixed(2)}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">紧急配送费</div>
                        <div class="detail-value">¥${order.urgentPrice ? order.urgentPrice.toFixed(2) : '0.00'}</div>
                    </div>
                    <div class="detail-row total-row">
                        <div class="detail-label">总计费用</div>
                        <div class="detail-value">¥${order.price.toFixed(2)}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">支付状态</div>
                        <div class="detail-value">${order.isPaid ? '已支付' : '未支付'}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">支付方式</div>
                        <div class="detail-value">${order.paymentMethod || '-'}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            ${order.status === 'pending' ? `
                <button class="secondary-btn" id="assign-vehicle-btn">分配车辆</button>
            ` : ''}
            ${order.status === 'in-progress' ? `
                <button class="secondary-btn" id="track-order-btn">跟踪订单</button>
            ` : ''}
            <button class="primary-btn" id="close-details-btn">关闭</button>
        </div>
    `;
    
    // 显示模态框
    showModal(modalContent, 'order-details-modal');
    
    // 绑定分配车辆按钮事件
    const assignVehicleBtn = document.getElementById('assign-vehicle-btn');
    if (assignVehicleBtn) {
        assignVehicleBtn.addEventListener('click', () => {
            closeModal();
            showAssignVehicleDialog(orderId);
        });
    }
    
    // 绑定跟踪订单按钮事件
    const trackOrderBtn = document.getElementById('track-order-btn');
    if (trackOrderBtn) {
        trackOrderBtn.addEventListener('click', () => {
            closeModal();
            trackOrder(orderId);
        });
    }
    
    // 绑定关闭按钮事件
    document.getElementById('close-details-btn').addEventListener('click', closeModal);
}

/**
 * 显示分配车辆对话框
 * @param {string} orderId - 订单ID
 */
function showAssignVehicleDialog(orderId) {
    // 查找订单
    const order = AdminState.orders.find(o => o.id === orderId);
    if (!order) return;
    
    // 获取可用车辆
    const availableVehicles = AdminState.vehicles.filter(v => v.status === 'available');
    
    // 创建模态框内容
    const modalContent = `
        <div class="modal-header">
            <h3>分配车辆</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <div class="order-summary">
                <p><strong>订单编号:</strong> ${order.id}</p>
                <p><strong>取货地址:</strong> ${order.pickupAddress}</p>
                <p><strong>送货地址:</strong> ${order.deliveryAddress}</p>
                <p><strong>货物类型:</strong> ${order.cargoType}</p>
                <p><strong>重量:</strong> ${order.weight} 公斤</p>
            </div>
            
            <div class="vehicle-selection">
                <h4>选择车辆</h4>
                ${availableVehicles.length > 0 ? `
                    <div class="radio-group">
                        ${availableVehicles.map((vehicle, index) => `
                            <div class="radio-item">
                                <input type="radio" name="vehicle" id="vehicle-${vehicle.id}" value="${vehicle.id}" ${index === 0 ? 'checked' : ''}>
                                <label for="vehicle-${vehicle.id}">
                                    <span class="vehicle-info">
                                        <span class="vehicle-id">${vehicle.id}</span>
                                        <span class="vehicle-type">${vehicle.type}</span>
                                    </span>
                                    <span class="vehicle-details">
                                        <span class="vehicle-driver">${vehicle.driver || '未知司机'}</span>
                                        <span class="vehicle-rating">${vehicle.rating ? `★ ${vehicle.rating}` : ''}</span>
                                    </span>
                                </label>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="form-group">
                        <label for="assign-priority">优先级</label>
                        <select id="assign-priority">
                            <option value="normal">普通</option>
                            <option value="high">高</option>
                            <option value="urgent">紧急</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="assign-note">备注信息</label>
                        <textarea id="assign-note" rows="2" placeholder="可选备注"></textarea>
                    </div>
                ` : `
                    <div class="no-vehicles-available">
                        <p>当前没有可用车辆</p>
                    </div>
                `}
            </div>
        </div>
        <div class="modal-footer">
            <button class="secondary-btn" id="cancel-assign-btn">取消</button>
            ${availableVehicles.length > 0 ? `
                <button class="primary-btn" id="confirm-assign-btn">确认分配</button>
            ` : `
                <button class="primary-btn disabled">确认分配</button>
            `}
        </div>
    `;
    
    // 显示模态框
    showModal(modalContent, 'assign-vehicle-modal');
    
    // 绑定取消按钮事件
    document.getElementById('cancel-assign-btn').addEventListener('click', closeModal);
    
    // 绑定确认分配按钮事件
    if (availableVehicles.length > 0) {
        document.getElementById('confirm-assign-btn').addEventListener('click', () => {
            // 获取选中的车辆ID
            const selectedVehicleId = document.querySelector('input[name="vehicle"]:checked').value;
            const priority = document.getElementById('assign-priority').value;
            const note = document.getElementById('assign-note').value;
            
            // 分配车辆
            assignVehicleToOrder(orderId, selectedVehicleId, { priority, note });
            
            // 关闭模态框
            closeModal();
        });
    }
}

/**
 * 分配车辆到订单
 * @param {string} orderId - 订单ID
 * @param {string} vehicleId - 车辆ID
 * @param {Object} options - 选项
 */
function assignVehicleToOrder(orderId, vehicleId, options = {}) {
    // 在实际应用中，这里会发送API请求
    simulateServerRequest('admin/orders/assign', {
        orderId,
        vehicleId,
        ...options
    })
    .then(() => {
        // 更新本地数据
        const orderIndex = AdminState.orders.findIndex(o => o.id === orderId);
        const vehicleIndex = AdminState.vehicles.findIndex(v => v.id === vehicleId);
        
        if (orderIndex !== -1 && vehicleIndex !== -1) {
            // 更新订单信息
            AdminState.orders[orderIndex].status = 'in-progress';
            AdminState.orders[orderIndex].assignedVehicle = vehicleId;
            AdminState.orders[orderIndex].updatedAt = new Date();
            
            // 更新车辆信息
            AdminState.vehicles[vehicleIndex].status = 'busy';
            AdminState.vehicles[vehicleIndex].lastOrder = orderId;
            
            // 更新UI
            if (AdminState.currentView === 'orders') {
                updateOrderRow(AdminState.orders[orderIndex]);
            } else if (AdminState.currentView === 'overview') {
                updateOrderSummary();
                updateVehicleSummary();
            } else if (AdminState.currentView === 'vehicles') {
                updateVehicleMarker(AdminState.vehicles[vehicleIndex]);
            }
            
            // 显示成功通知
            showNotification(`已成功将车辆 ${vehicleId} 分配给订单 ${orderId}`, 'success');
        }
    })
    .catch(() => {
        showNotification('分配失败，请重试', 'error');
    });
}

/**
 * 跟踪订单
 * @param {string} orderId - 订单ID
 */
function trackOrder(orderId) {
    // 查找订单
    const order = AdminState.orders.find(o => o.id === orderId);
    if (!order || order.status !== 'in-progress') return;
    
    // 查找车辆
    const vehicle = AdminState.vehicles.find(v => v.id === order.assignedVehicle);
    if (!vehicle) return;
    
    // 创建模态框内容
    const modalContent = `
        <div class="modal-header">
            <h3>订单跟踪</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <div class="tracking-info">
                <div class="tracking-summary">
                    <p><strong>订单编号:</strong> ${order.id}</p>
                    <p><strong>当前状态:</strong> ${getOrderStatusText(order.status)}</p>
                    <p><strong>配送车辆:</strong> ${order.assignedVehicle}</p>
                    <p><strong>预计送达:</strong> ${order.estimatedDelivery ? formatDateTime(order.estimatedDelivery) : '未确定'}</p>
                </div>
                
                <div class="tracking-map-container" id="tracking-map-container">
                    <div class="loading-indicator">加载地图中...</div>
                </div>
                
                <div class="tracking-status">
                    <h4>配送进度</h4>
                    <div class="status-timeline">
                        <div class="timeline-node active">
                            <div class="node-dot"></div>
                            <div class="node-content">
                                <div class="node-time">${formatTime(order.createdAt)}</div>
                                <div class="node-title">订单创建</div>
                            </div>
                        </div>
                        <div class="timeline-node active">
                            <div class="node-dot"></div>
                            <div class="node-content">
                                <div class="node-time">${formatTime(order.updatedAt)}</div>
                                <div class="node-title">司机接单</div>
                            </div>
                        </div>
                        <div class="timeline-node ${order.pickupTime ? 'active' : ''}">
                            <div class="node-dot"></div>
                            <div class="node-content">
                                <div class="node-time">${order.pickupTime ? formatTime(order.pickupTime) : '预计 ' + formatTime(new Date(Date.now() + 15 * 60000))}</div>
                                <div class="node-title">到达取货点</div>
                            </div>
                        </div>
                        <div class="timeline-node">
                            <div class="node-dot"></div>
                            <div class="node-content">
                                <div class="node-time">${formatTime(order.estimatedDelivery || new Date(Date.now() + 45 * 60000))}</div>
                                <div class="node-title">送达目的地</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="secondary-btn" id="contact-driver-btn">联系司机</button>
            <button class="primary-btn" id="close-tracking-btn">关闭</button>
        </div>
    `;
    
    // 显示模态框
    showModal(modalContent, 'tracking-modal');
    
    // 绑定关闭按钮事件
    document.getElementById('close-tracking-btn').addEventListener('click', closeModal);
    
    // 绑定联系司机按钮事件
    document.getElementById('contact-driver-btn').addEventListener('click', () => {
        if (vehicle.phone) {
            alert(`联系司机: ${vehicle.driver}\n电话: ${vehicle.phone}`);
        } else {
            alert('没有司机联系信息');
        }
    });
    
    // 初始化跟踪地图
    initTrackingMap(order, vehicle);
}

/**
 * 初始化跟踪地图
 * @param {Object} order - 订单数据
 * @param {Object} vehicle - 车辆数据
 */
function initTrackingMap(order, vehicle) {
    // 获取地图容器
    const mapContainer = document.getElementById('tracking-map-container');
    if (!mapContainer) return;
    
    // 创建地图实例
    const trackingMap = new AMap.Map(mapContainer, {
        zoom: 13,
        center: vehicle.position
    });
    
    // 添加比例尺和缩放控件
    trackingMap.addControl(new AMap.Scale());
    trackingMap.addControl(new AMap.ToolBar());
    
    // 添加取货点标记
    const pickupMarker = new AMap.Marker({
        position: order.pickupPosition,
        map: trackingMap,
        icon: new AMap.Icon({
            size: new AMap.Size(32, 32),
            image: '../assets/icons/pickup-marker.png',
            imageSize: new AMap.Size(32, 32)
        }),
        title: '取货点'
    });
    
    // 添加送货点标记
    const deliveryMarker = new AMap.Marker({
        position: order.deliveryPosition,
        map: trackingMap,
        icon: new AMap.Icon({
            size: new AMap.Size(32, 32),
            image: '../assets/icons/delivery-marker.png',
            imageSize: new AMap.Size(32, 32)
        }),
        title: '送货点'
    });
    
    // 添加车辆标记
    const vehicleMarker = new AMap.Marker({
        position: vehicle.position,
        map: trackingMap,
        icon: new AMap.Icon({
            size: new AMap.Size(48, 48),
            image: '../assets/icons/vehicle-in-transit.png',
            imageSize: new AMap.Size(48, 48)
        }),
        title: '配送车辆',
        angle: 90
    });
    
    // 创建信息窗体
    const vehicleInfoWindow = new AMap.InfoWindow({
        content: `
            <div class="info-window vehicle-info">
                <h3>配送车辆</h3>
                <p>车辆ID: ${vehicle.id}</p>
                <p>车辆类型: ${vehicle.type}</p>
                <p>司机: ${vehicle.driver || '未知'}</p>
                <p>联系电话: ${vehicle.phone || '未知'}</p>
            </div>
        `,
        offset: new AMap.Pixel(0, -20)
    });
    
    // 点击车辆标记显示信息窗体
    vehicleMarker.on('click', () => {
        vehicleInfoWindow.open(trackingMap, vehicleMarker.getPosition());
    });
    
    // 绘制路线
    if (window.planRoute) {
        // 规划取货路线
        window.planRoute(trackingMap, vehicle.position, order.pickupPosition, {
            strokeColor: '#3370FF',
            strokeWeight: 6,
            strokeOpacity: 0.5
        });
        
        // 规划配送路线
        window.planRoute(trackingMap, order.pickupPosition, order.deliveryPosition, {
            strokeColor: '#FF5733',
            strokeWeight: 6,
            strokeOpacity: 0.5
        });
    }
    
    // 调整地图视野以包含所有标记点
    const bounds = new AMap.Bounds([
        vehicle.position,
        order.pickupPosition,
        order.deliveryPosition
    ]);
    trackingMap.setBounds(bounds, [50, 50, 50, 50]);
    
    // 模拟车辆移动
    simulateVehicleMovement(trackingMap, vehicleMarker, vehicle, order);
}

/**
 * 模拟车辆移动
 * @param {Object} map - 地图实例
 * @param {Object} marker - 车辆标记
 * @param {Object} vehicle - 车辆数据
 * @param {Object} order - 订单数据
 */
function simulateVehicleMovement(map, marker, vehicle, order) {
    // 计算车辆到取货点的中间点
    const currentPosition = vehicle.position;
    const targetPosition = order.pickupTime ? order.deliveryPosition : order.pickupPosition;
    
    // 如果目标位置与当前位置相同，则不需要移动
    if (currentPosition[0] === targetPosition[0] && currentPosition[1] === targetPosition[1]) {
        return;
    }
    
    // 计算方向角度
    const angle = Math.atan2(
        targetPosition[1] - currentPosition[1],
        targetPosition[0] - currentPosition[0]
    ) * 180 / Math.PI;
    marker.setAngle(angle);
    
    // 计算移动步数
    const steps = 20;
    const deltaX = (targetPosition[0] - currentPosition[0]) / steps;
    const deltaY = (targetPosition[1] - currentPosition[1]) / steps;
    
    // 模拟移动
    let step = 0;
    const moveInterval = setInterval(() => {
        step++;
        
        // 计算新位置
        const newPosition = [
            currentPosition[0] + deltaX * step,
            currentPosition[1] + deltaY * step
        ];
        
        // 更新标记位置
        marker.setPosition(newPosition);
        
        // 到达目标位置或模态框已关闭，则停止移动
        if (step >= steps || !document.querySelector('.tracking-modal')) {
            clearInterval(moveInterval);
        }
    }, 1000);
}

/**
 * 删除订单
 * @param {string} orderId - 订单ID
 */
function deleteOrder(orderId) {
    // 确认删除
    if (!confirm(`确定要删除订单 ${orderId} 吗？此操作不可撤销。`)) {
        return;
    }
    
    // 在实际应用中，这里会发送API请求
    simulateServerRequest('admin/orders/delete', { orderId })
    .then(() => {
        // 从本地数据中删除订单
        AdminState.orders = AdminState.orders.filter(o => o.id !== orderId);
        
        // 更新UI
        if (AdminState.currentView === 'orders') {
            renderOrdersTable();
        } else if (AdminState.currentView === 'overview') {
            updateOrderSummary();
        }
        
        // 显示成功通知
        showNotification(`已成功删除订单 ${orderId}`, 'success');
    })
    .catch(() => {
        showNotification('删除失败，请重试', 'error');
    });
}

/**
 * 渲染告警通知
 */
function renderAlertNotifications() {
    const alertsContainer = document.getElementById('system-alerts');
    if (!alertsContainer) return;
    
    // 获取未处理的告警
    const pendingAlerts = AdminState.alerts.filter(alert => !alert.dismissed);
    
    // 更新告警图标
    const alertCounter = document.querySelector('.alerts-counter');
    if (alertCounter) {
        alertCounter.textContent = pendingAlerts.length;
        alertCounter.style.display = pendingAlerts.length > 0 ? 'flex' : 'none';
    }
    
    // 没有告警时显示空状态
    if (pendingAlerts.length === 0) {
        alertsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fa fa-check-circle"></i>
                </div>
                <p>没有未处理的系统告警</p>
            </div>
        `;
        return;
    }
    
    // 渲染告警列表
    const alertsList = pendingAlerts.map(alert => `
        <div class="alert-item ${alert.level}" data-alert-id="${alert.id}">
            <div class="alert-icon">
                <i class="fa fa-${getAlertIcon(alert.level)}"></i>
            </div>
            <div class="alert-content">
                <div class="alert-header">
                    <span class="alert-title">${alert.title}</span>
                    <span class="alert-time">${formatTimeAgo(alert.time)}</span>
                </div>
                <div class="alert-message">${alert.message}</div>
            </div>
            <button class="dismiss-alert-btn" title="忽略">
                <i class="fa fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // 更新容器内容
    alertsContainer.innerHTML = alertsList;
    
    // 绑定忽略按钮事件
    alertsContainer.querySelectorAll('.dismiss-alert-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const alertId = e.target.closest('.alert-item').getAttribute('data-alert-id');
            dismissAlert(alertId);
        });
    });
    
    // 绑定点击事件
    alertsContainer.querySelectorAll('.alert-item').forEach(item => {
        item.addEventListener('click', () => {
            const alertId = item.getAttribute('data-alert-id');
            viewAlertDetails(alertId);
        });
    });
}

/**
 * 忽略告警
 * @param {string} alertId - 告警ID
 */
function dismissAlert(alertId) {
    // 在实际应用中，这里会发送API请求
    simulateServerRequest('admin/alerts/dismiss', { alertId })
    .then(() => {
        // 更新本地数据
        const alertIndex = AdminState.alerts.findIndex(a => a.id === alertId);
        if (alertIndex !== -1) {
            AdminState.alerts[alertIndex].dismissed = true;
        }
        
        // 更新UI
        renderAlertNotifications();
    });
}

/**
 * 查看告警详情
 * @param {string} alertId - 告警ID
 */
function viewAlertDetails(alertId) {
    // 查找告警
    const alert = AdminState.alerts.find(a => a.id === alertId);
    if (!alert) return;
    
    // 创建模态框内容
    const modalContent = `
        <div class="modal-header">
            <h3>告警详情</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <div class="alert-details ${alert.level}">
                <div class="detail-row">
                    <div class="detail-label">告警类型</div>
                    <div class="detail-value">${alert.title}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">级别</div>
                    <div class="detail-value alert-level-${alert.level}">${getAlertLevelText(alert.level)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">时间</div>
                    <div class="detail-value">${formatDateTime(alert.time)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">内容</div>
                    <div class="detail-value">${alert.message}</div>
                </div>
                ${alert.relatedId ? `
                <div class="detail-row">
                    <div class="detail-label">相关ID</div>
                    <div class="detail-value">${alert.relatedId}</div>
                </div>
                ` : ''}
                ${alert.recommendation ? `
                <div class="detail-row">
                    <div class="detail-label">建议操作</div>
                    <div class="detail-value">${alert.recommendation}</div>
                </div>
                ` : ''}
            </div>
        </div>
        <div class="modal-footer">
            ${!alert.dismissed ? `
                <button class="secondary-btn" id="dismiss-alert-btn">忽略告警</button>
            ` : ''}
            ${alert.relatedId ? `
                <button class="secondary-btn" id="view-related-btn">查看相关</button>
            ` : ''}
            <button class="primary-btn" id="close-alert-details-btn">关闭</button>
        </div>
    `;
    
    // 显示模态框
    showModal(modalContent, 'alert-details-modal');
    
    // 绑定忽略告警按钮事件
    const dismissBtn = document.getElementById('dismiss-alert-btn');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            dismissAlert(alertId);
            closeModal();
        });
    }
    
    // 绑定查看相关按钮事件
    const viewRelatedBtn = document.getElementById('view-related-btn');
    if (viewRelatedBtn && alert.relatedId) {
        viewRelatedBtn.addEventListener('click', () => {
            closeModal();
            
            // 根据告警类型确定查看的内容
            if (alert.type === 'order') {
                viewOrderDetails(alert.relatedId);
            } else if (alert.type === 'vehicle') {
                viewVehicleDetails(alert.relatedId);
            }
        });
    }
    
    // 绑定关闭按钮事件
    document.getElementById('close-alert-details-btn').addEventListener('click', closeModal);
}

/**
 * 生成随机告警
 */
function generateRandomAlert() {
    // 告警类型
    const alertTypes = [
        {
            title: '订单延迟',
            message: '订单配送时间超出预期',
            level: 'warning',
            type: 'order'
        },
        {
            title: '车辆离线',
            message: '车辆长时间未上报位置',
            level: 'error',
            type: 'vehicle'
        },
        {
            title: '系统负载高',
            message: '系统处理负载接近阈值',
            level: 'info',
            type: 'system'
        },
        {
            title: '区域订单密度高',
            message: '特定区域订单量激增',
            level: 'warning',
            type: 'area'
        }
    ];
    
    // 随机选择告警类型
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    
    // 设置相关ID
    let relatedId = null;
    if (alertType.type === 'order' && AdminState.orders.length > 0) {
        const randomOrder = AdminState.orders[Math.floor(Math.random() * AdminState.orders.length)];
        relatedId = randomOrder.id;
    } else if (alertType.type === 'vehicle' && AdminState.vehicles.length > 0) {
        const randomVehicle = AdminState.vehicles[Math.floor(Math.random() * AdminState.vehicles.length)];
        relatedId = randomVehicle.id;
    }
    
    // 创建告警
    const newAlert = {
        id: `alert-${Date.now()}`,
        title: alertType.title,
        message: alertType.message + (relatedId ? ` (${alertType.type} ID: ${relatedId})` : ''),
        level: alertType.level,
        type: alertType.type,
        relatedId,
        time: new Date(),
        dismissed: false
    };
    
    // 添加推荐操作
    if (alertType.type === 'order') {
        newAlert.recommendation = '请联系司机确认情况，必要时重新分配车辆';
    } else if (alertType.type === 'vehicle') {
        newAlert.recommendation = '请联系司机确认车辆状态，必要时将其标记为离线';
    } else if (alertType.type === 'system') {
        newAlert.recommendation = '请检查服务器负载情况，必要时增加服务器资源';
    } else if (alertType.type === 'area') {
        newAlert.recommendation = '请调整该区域车辆分配，或临时提高接单价格';
    }
    
    // 添加到告警列表
    AdminState.alerts.unshift(newAlert);
    
    // 更新UI
    renderAlertNotifications();
    
    // 显示告警通知
    showNotification(newAlert.message, newAlert.level);
}

/**
 * 显示模态框
 * @param {string} content - 模态框内容
 * @param {string} className - 模态框类名
 */
function showModal(content, className = '') {
    // 创建模态框容器
    const modalContainer = document.createElement('div');
    modalContainer.className = `modal-container ${className}`;
    
    // 创建模态框
    modalContainer.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            ${content}
        </div>
    `;
    
    // 添加到文档
    document.body.appendChild(modalContainer);
    
    // 添加事件监听
    const closeBtn = modalContainer.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal(modalContainer);
        });
    }
    
    // 点击遮罩关闭
    const overlay = modalContainer.querySelector('.modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            closeModal(modalContainer);
        });
    }
    
    // 阻止冒泡
    const modalContent = modalContainer.querySelector('.modal-content');
    if (modalContent) {
        modalContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // 显示动画
    setTimeout(() => {
        modalContainer.classList.add('show');
    }, 10);
    
    return modalContainer;
}

/**
 * 关闭模态框
 * @param {HTMLElement} modalContainer - 模态框容器
 */
function closeModal(modalContainer) {
    // 如果没有指定模态框，则关闭所有模态框
    if (!modalContainer) {
        const modals = document.querySelectorAll('.modal-container');
        modals.forEach(modal => {
            closeModal(modal);
        });
        return;
    }
    
    // 添加关闭动画
    modalContainer.classList.remove('show');
    
    // 移除模态框
    setTimeout(() => {
        if (modalContainer.parentNode) {
            modalContainer.parentNode.removeChild(modalContainer);
        }
    }, 300);
}

/**
 * 显示通知
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型
 */
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // 设置通知内容
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fa fa-${getNotificationIcon(type)}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <i class="fa fa-times"></i>
        </button>
    `;
    
    // 获取通知容器
    let notificationContainer = document.querySelector('.notification-container');
    
    // 如果容器不存在，则创建
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // 添加到容器
    notificationContainer.appendChild(notification);
    
    // 绑定关闭按钮事件
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            removeNotification(notification);
        });
    }
    
    // 显示动画
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 自动关闭
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
}

/**
 * 移除通知
 * @param {HTMLElement} notification - 通知元素
 */
function removeNotification(notification) {
    // 添加关闭动画
    notification.classList.remove('show');
    
    // 移除元素
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
            
            // 如果没有通知了，则移除容器
            const container = document.querySelector('.notification-container');
            if (container && container.children.length === 0) {
                container.parentNode.removeChild(container);
            }
        }
    }, 300);
}

/**
 * 模拟服务器请求
 * @param {string} endpoint - 请求地址
 * @param {Object} data - 请求数据
 * @returns {Promise} 请求承诺
 */
function simulateServerRequest(endpoint, data = {}) {
    return new Promise((resolve, reject) => {
        console.log(`模拟请求: ${endpoint}`, data);
        
        // 模拟网络延迟
        setTimeout(() => {
            // 模拟成功率 95%
            if (Math.random() > 0.05) {
                // 模拟响应
                const response = { success: true, message: 'OK', data: {} };
                
                // 根据请求类型返回不同数据
                if (endpoint.includes('orders')) {
                    // 使用mock-data.js中的模拟订单数据
                    const mockOrders = window.getMockOrders ? window.getMockOrders() : [];
                    response.data = mockOrders;
                } else if (endpoint.includes('vehicles')) {
                    // 使用mock-data.js中的模拟车辆数据
                    const mockVehicles = window.getMockVehicles ? window.getMockVehicles() : [];
                    response.data = mockVehicles;
                } else if (endpoint.includes('statistics')) {
                    // 使用mock-data.js中的模拟统计数据
                    const mockStats = window.getMockStatistics ? window.getMockStatistics() : {};
                    response.data = mockStats;
                }
                
                console.log(`模拟响应: ${endpoint}`, response);
                resolve(response.data);
            } else {
                // 模拟请求失败
                console.error(`模拟请求失败: ${endpoint}`);
                reject({ error: '请求失败', code: 500 });
            }
        }, 300);
    });
}

/**
 * 格式化日期时间
 * @param {Date|string} date - 日期对象或字符串
 * @returns {string} 格式化后的日期时间
 */
function formatDateTime(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化日期
 * @param {Date|string} date - 日期对象或字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * 格式化时间
 * @param {Date|string} date - 日期对象或字符串
 * @returns {string} 格式化后的时间
 */
function formatTime(date) {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
}

/**
 * 格式化时间戳为相对时间
 * @param {Date|string} date - 日期对象或字符串
 * @returns {string} 相对时间
 */
function formatTimeAgo(date) {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) {
        return `${diffSec}秒前`;
    } else if (diffSec < 3600) {
        return `${Math.floor(diffSec / 60)}分钟前`;
    } else if (diffSec < 86400) {
        return `${Math.floor(diffSec / 3600)}小时前`;
    } else {
        return formatDate(date);
    }
}

/**
 * 获取订单状态文本
 * @param {string} status - 订单状态
 * @returns {string} 状态文本
 */
function getOrderStatusText(status) {
    const statusMap = {
        'pending': '待处理',
        'in-progress': '配送中',
        'completed': '已完成',
        'cancelled': '已取消'
    };
    
    return statusMap[status] || status;
}

/**
 * 获取车辆状态文本
 * @param {string} status - 车辆状态
 * @returns {string} 状态文本
 */
function getVehicleStatusText(status) {
    const statusMap = {
        'available': '空闲',
        'busy': '繁忙',
        'offline': '离线'
    };
    
    return statusMap[status] || status;
}

/**
 * 获取告警图标
 * @param {string} level - 告警级别
 * @returns {string} 图标名称
 */
function getAlertIcon(level) {
    const iconMap = {
        'info': 'info-circle',
        'warning': 'exclamation-triangle',
        'error': 'exclamation-circle'
    };
    
    return iconMap[level] || 'bell';
}

/**
 * 获取告警级别文本
 * @param {string} level - 告警级别
 * @returns {string} 级别文本
 */
function getAlertLevelText(level) {
    const levelMap = {
        'info': '信息',
        'warning': '警告',
        'error': '错误'
    };
    
    return levelMap[level] || level;
}

/**
 * 获取通知图标
 * @param {string} type - 通知类型
 * @returns {string} 图标名称
 */
function getNotificationIcon(type) {
    const iconMap = {
        'info': 'info-circle',
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'error': 'exclamation-circle'
    };
    
    return iconMap[type] || 'bell';
}

/**
 * 获取随机车辆ID
 * @returns {string} 车辆ID
 */
function getRandomVehicle() {
    const availableVehicles = AdminState.vehicles.filter(v => v.status === 'available');
    
    if (availableVehicles.length === 0) {
        return 'V' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    }
    
    const randomVehicle = availableVehicles[Math.floor(Math.random() * availableVehicles.length)];
    return randomVehicle.id;
}

// 初始化管理界面
document.addEventListener('DOMContentLoaded', initAdminInterface);
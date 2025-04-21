/**
 * 智送城市货运智能调度系统 - 司机界面逻辑
 * 负责司机接单、路线导航、订单管理等功能
 */

// 司机界面状态
const DriverState = {
    // 司机状态: 'offline'(离线), 'available'(可接单), 'busy'(送货中)
    status: 'offline',
    // 司机信息
    driverInfo: {
        id: 'D10086',
        name: '张师傅',
        vehicle: '东Y·12345',
        vehicleType: '小型货车',
        capacity: '3m³',
        rating: 4.8,
        totalOrders: 532,
        phone: '139****5678'
    },
    // 当前位置
    currentPosition: null,
    // 当前任务列表
    tasks: [],
    // 当前导航路线
    currentRoute: null,
    // 任务通知队列
    notifications: []
};

/**
 * 初始化司机界面
 */
function initDriverInterface() {
    console.log('初始化司机界面');
    
    // 获取司机信息(实际应用中从服务器获取)
    loadDriverInfo();
    
    // 设置状态切换开关
    setupStatusToggle();
    
    // 设置任务操作按钮
    setupTaskActions();
    
    // 模拟获取当前位置
    simulateCurrentPosition();
    
    // 加载任务列表
    loadTasks();
    
    // 设置实时刷新
    setupRealTimeUpdates();
    
    // 监听地图路线计算事件
    listenForRouteEvents();
    
    // 订阅订单匹配事件
    subscribeToOrderMatching();
}

/**
 * 加载司机信息
 */
function loadDriverInfo() {
    // 实际应用中，这里会从服务器API获取司机信息
    // 这里使用模拟数据
    
    // 如果是已登录状态，并且角色是司机，更新司机信息
    if (window.AppState && window.AppState.isLoggedIn && window.AppState.userRole === 'driver') {
        const { currentUser } = window.AppState;
        
        // 更新司机信息
        DriverState.driverInfo = {
            ...DriverState.driverInfo,
            name: currentUser.name || DriverState.driverInfo.name,
            phone: currentUser.phone || DriverState.driverInfo.phone
        };
    }
}

/**
 * 设置司机状态切换开关
 */
function setupStatusToggle() {
    const statusToggle = document.getElementById('driver-online');
    const statusText = document.querySelector('.status-text');
    
    if (!statusToggle || !statusText) return;
    
    // 设置初始状态
    statusToggle.checked = DriverState.status !== 'offline';
    updateStatusText();
    
    // 监听状态切换
    statusToggle.addEventListener('change', () => {
        if (statusToggle.checked) {
            // 上线
            if (DriverState.tasks.length > 0) {
                DriverState.status = 'busy';
            } else {
                DriverState.status = 'available';
            }
            
            // 模拟发送上线请求
            simulateServerRequest('driver/online', { driverId: DriverState.driverInfo.id })
                .then(() => {
                    window.showNotification('您已上线，可以接收订单', 'success');
                });
        } else {
            // 下线
            DriverState.status = 'offline';
            
            // 模拟发送下线请求
            simulateServerRequest('driver/offline', { driverId: DriverState.driverInfo.id })
                .then(() => {
                    window.showNotification('您已下线，暂停接单', 'info');
                });
        }
        
        // 更新状态文本
        updateStatusText();
    });
}

/**
 * 更新状态文本显示
 */
function updateStatusText() {
    const statusText = document.querySelector('.status-text');
    if (!statusText) return;
    
    // 根据状态设置文本
    switch (DriverState.status) {
        case 'available':
            statusText.textContent = '接单中';
            statusText.style.color = '#52c41a'; // 绿色
            break;
        case 'busy':
            statusText.textContent = '送货中';
            statusText.style.color = '#faad14'; // 橙色
            break;
        case 'offline':
            statusText.textContent = '已下线';
            statusText.style.color = '#8c8c8c'; // 灰色
            break;
    }
}

/**
 * 设置任务操作按钮事件
 */
function setupTaskActions() {
    // 由于任务是动态加载的，使用事件委托
    const taskContainer = document.getElementById('driver-tasks');
    
    if (!taskContainer) return;
    
    // 监听任务操作按钮
    taskContainer.addEventListener('click', (e) => {
        // 处理导航按钮
        if (e.target.classList.contains('navigate-btn') || 
            e.target.closest('.navigate-btn')) {
            const taskId = e.target.closest('.task-card').dataset.taskId;
            navigateToTask(taskId);
        }
        
        // 处理完成按钮
        if (e.target.classList.contains('complete-btn') || 
            e.target.closest('.complete-btn')) {
            const taskId = e.target.closest('.task-card').dataset.taskId;
            completeTask(taskId);
        }
        
        // 处理取消按钮
        if (e.target.classList.contains('cancel-btn') || 
            e.target.closest('.cancel-btn')) {
            const taskId = e.target.closest('.task-card').dataset.taskId;
            cancelTask(taskId);
        }
        
        // 处理联系客户按钮
        if (e.target.classList.contains('contact-btn') || 
            e.target.closest('.contact-btn')) {
            const taskId = e.target.closest('.task-card').dataset.taskId;
            contactCustomer(taskId);
        }
    });
}

/**
 * 模拟获取当前位置
 */
function simulateCurrentPosition() {
    // 如果有实际的定位系统，这里会使用浏览器的定位API
    // navigator.geolocation.getCurrentPosition()
    
    // 模拟位置（使用默认中心点）
    DriverState.currentPosition = window.CONFIG.DEFAULT_CENTER;
    
    // 模拟位置更新
    setInterval(() => {
        // 如果司机在线，才更新位置
        if (DriverState.status !== 'offline') {
            // 随机小幅度移动，模拟位置变化
            const offsetLng = (Math.random() - 0.5) * 0.0005;
            const offsetLat = (Math.random() - 0.5) * 0.0005;
            
            DriverState.currentPosition = [
                DriverState.currentPosition[0] + offsetLng,
                DriverState.currentPosition[1] + offsetLat
            ];
            
            // 更新地图上的位置
            updateDriverPositionOnMap();
            
            // 如果有当前任务，且在导航状态，更新导航信息
            if (DriverState.currentRoute && DriverState.status === 'busy') {
                updateNavigationInfo();
            }
        }
    }, 3000);
}

/**
 * 更新司机位置到地图
 */
function updateDriverPositionOnMap() {
    const driverMap = window.mapInstances ? window.mapInstances['driver-map'] : null;
    
    if (!driverMap) return;
    
    // 调用添加或更新车辆标记的函数
    if (window.mapMarkers && window.mapMarkers.vehicles) {
        const currentMarker = window.mapMarkers.vehicles['current-vehicle'];
        
        if (currentMarker) {
            // 更新位置
            currentMarker.setPosition(DriverState.currentPosition);
        } else if (window.addVehicleMarker) {
            // 添加标记
            window.addVehicleMarker(driverMap, {
                id: 'current-vehicle',
                position: DriverState.currentPosition,
                status: DriverState.status === 'available' ? 'available' : 'busy',
                isCurrent: true
            });
        }
    }
}

/**
 * 加载任务列表
 */
function loadTasks() {
    // 清空现有任务列表
    DriverState.tasks = [];
    
    // 实际应用中，这里会从服务器API获取任务列表
    // 这里使用模拟数据
    simulateServerRequest('driver/tasks', { driverId: DriverState.driverInfo.id })
        .then(tasks => {
            // 如果没有任务，显示引导信息
            if (tasks.length === 0) {
                renderEmptyTaskList();
                return;
            }
            
            // 更新任务列表
            DriverState.tasks = tasks;
            
            // 如果有任务，状态改为忙碌
            if (DriverState.status !== 'offline' && tasks.length > 0) {
                DriverState.status = 'busy';
                updateStatusText();
            }
            
            // 渲染任务列表
            renderTaskList();
            
            // 在地图上显示任务路线
            showTasksOnMap();
        });
}

/**
 * 渲染空任务列表
 */
function renderEmptyTaskList() {
    const taskContainer = document.getElementById('driver-tasks');
    if (!taskContainer) return;
    
    taskContainer.innerHTML = `
        <div class="empty-tasks">
            <img src="assets/icons/empty-task.png" alt="无任务" style="width:80px;opacity:0.6">
            <p>当前没有配送任务</p>
            <p class="sub-text">开启接单状态，等待新订单</p>
        </div>
    `;
}

/**
 * 渲染任务列表
 */
function renderTaskList() {
    const taskContainer = document.getElementById('driver-tasks');
    if (!taskContainer) return;
    
    // 清空容器
    taskContainer.innerHTML = '';
    
    // 按任务状态排序：正在进行的优先，然后是等待中，最后是已完成
    const sortedTasks = [...DriverState.tasks].sort((a, b) => {
        const statusOrder = { 'in-progress': 0, 'pending': 1, 'completed': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });
    
    // 遍历任务列表渲染
    sortedTasks.forEach(task => {
        taskContainer.innerHTML += renderTaskCard(task);
    });
}

/**
 * 渲染单个任务卡片
 * @param {Object} task - 任务数据
 * @returns {string} 任务卡片HTML
 */
function renderTaskCard(task) {
    // 任务类型标签样式
    const typeClass = task.type === 'pickup' ? 'pickup' : 'delivery';
    
    // 任务状态样式
    let statusClass = '';
    let statusText = '';
    let isCompleted = false;
    let isPending = false;
    
    switch (task.status) {
        case 'completed':
            statusClass = 'completed';
            statusText = '已完成';
            isCompleted = true;
            break;
        case 'in-progress':
            statusClass = 'in-progress';
            statusText = '进行中';
            break;
        case 'pending':
            statusClass = 'pending';
            statusText = '等待中';
            isPending = true;
            break;
    }
    
    // 计算预计到达时间
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + task.estimatedMinutes * 60000);
    const formattedTime = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `
        <div class="task-card ${statusClass}" data-task-id="${task.id}">
            <div class="task-header">
                <span class="task-id">${task.orderId}</span>
                <span class="task-type ${typeClass}">${task.type === 'pickup' ? '取货' : '送货'}</span>
            </div>
            <div class="address">
                ${task.address}
            </div>
            <div class="contact">
                联系人：${task.contact} • ${task.phone}
            </div>
            <div class="cargo-info">
                ${task.cargoInfo}
            </div>
            <div class="time-estimate">
                预计到达：<strong>${formattedTime}</strong> (约${task.estimatedMinutes}分钟)
            </div>
            <div class="task-actions">
                ${
                    isCompleted 
                    ? '<span class="status-tag completed">已完成</span>' 
                    : `
                        <button class="secondary-btn navigate-btn">
                            <i class="fa fa-map-marker"></i> 导航
                        </button>
                        <button class="primary-btn complete-btn">
                            ${isPending ? '开始' : '完成'}
                        </button>
                      `
                }
            </div>
            <div class="additional-actions">
                <button class="text-btn contact-btn">联系客户</button>
                ${!isCompleted ? '<button class="text-btn cancel-btn">取消任务</button>' : ''}
            </div>
        </div>
    `;
}

/**
 * 在地图上显示任务路线
 */
function showTasksOnMap() {
    const driverMap = window.mapInstances ? window.mapInstances['driver-map'] : null;
    
    if (!driverMap || !window.drawRoute) return;
    
    // 清除现有标记
    if (window.clearMapMarkers) {
        window.clearMapMarkers('driver');
    }
    
    // 添加当前位置标记
    if (DriverState.currentPosition) {
        if (window.addVehicleMarker) {
            window.addVehicleMarker(driverMap, {
                id: 'current-vehicle',
                position: DriverState.currentPosition,
                status: DriverState.status === 'available' ? 'available' : 'busy',
                isCurrent: true
            });
        }
    }
    
    // 只显示未完成的任务
    const activeTasks = DriverState.tasks.filter(task => task.status !== 'completed');
    
    // 按任务顺序（优先进行中的任务），获取取货点和送货点
    activeTasks.sort((a, b) => {
        if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
        if (a.status !== 'in-progress' && b.status === 'in-progress') return 1;
        return 0;
    });
    
    // 如果没有任务，直接返回
    if (activeTasks.length === 0) return;
    
    // 创建标记并绘制路线
    activeTasks.forEach((task, index) => {
        // 添加任务点标记
        if (window.addOrderMarker) {
            window.addOrderMarker(driverMap, {
                id: `task-${task.id}`,
                position: task.position,
                title: `${task.type === 'pickup' ? '取' : '送'}: ${task.address}`,
                type: task.type
            });
        }
        
        // 如果是第一个任务，绘制从当前位置到任务点的路线
        if (index === 0 && DriverState.currentPosition) {
            window.drawRoute(driverMap, {
                id: `route-to-${task.id}`,
                origin: DriverState.currentPosition,
                destination: task.position,
                type: 'driving'
            });
            
            // 保存当前路线信息
            DriverState.currentRoute = {
                id: task.id,
                taskType: task.type,
                destination: task.position,
                address: task.address
            };
        }
        
        // 如果有下一个任务，绘制到下一个任务点的路线
        if (index < activeTasks.length - 1) {
            const nextTask = activeTasks[index + 1];
            window.drawRoute(driverMap, {
                id: `route-${task.id}-to-${nextTask.id}`,
                origin: task.position,
                destination: nextTask.position,
                type: 'driving',
                strokeColor: '#0066FF', // 使用不同颜色区分
                strokeOpacity: 0.5      // 降低透明度
            });
        }
    });
    
    // 聚焦地图到第一个任务点
    if (activeTasks[0] && window.moveMapToPosition) {
        window.moveMapToPosition('driver-map', activeTasks[0].position, 14);
    }
}

/**
 * 导航到指定任务
 * @param {string} taskId - 任务ID
 */
function navigateToTask(taskId) {
    // 查找任务
    const task = DriverState.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // 开始导航
    startNavigation(task);
}

/**
 * 开始导航
 * @param {Object} task - 任务对象
 */
function startNavigation(task) {
    const driverMap = window.mapInstances ? window.mapInstances['driver-map'] : null;
    
    if (!driverMap || !DriverState.currentPosition) return;
    
    // 保存当前导航任务
    DriverState.currentRoute = {
        id: task.id,
        taskType: task.type,
        destination: task.position,
        address: task.address
    };
    
    // 绘制导航路线
    if (window.drawRoute) {
        window.drawRoute(driverMap, {
            id: `navigation-${task.id}`,
            origin: DriverState.currentPosition,
            destination: task.position,
            type: 'driving',
            panel: 'navigation-panel' // 导航指示面板
        });
    }
    
    // 显示导航面板
    const navPanel = document.querySelector('.navigation-panel');
    if (navPanel) {
        navPanel.classList.remove('hidden');
        navPanel.innerHTML = `
            <div class="nav-header">
                <h3>${task.type === 'pickup' ? '前往取货点' : '前往送货点'}</h3>
                <button class="close-nav-btn">×</button>
            </div>
            <div class="nav-address">
                <strong>${task.address}</strong>
            </div>
            <div class="nav-instructions">
                <div class="nav-instruction">
                    <div class="instruction-icon">
                        <i class="fa fa-arrow-right"></i>
                    </div>
                    <div class="instruction-text">
                        导航启动中...
                    </div>
                </div>
            </div>
            <div class="nav-time-distance">
                <div class="nav-distance">计算中...</div>
                <div class="nav-time">计算中...</div>
            </div>
            <button class="primary-btn arrive-btn">
                到达目的地
            </button>
        `;
        
        // 绑定关闭导航按钮
        navPanel.querySelector('.close-nav-btn').addEventListener('click', () => {
            navPanel.classList.add('hidden');
        });
        
        // 绑定到达按钮
        navPanel.querySelector('.arrive-btn').addEventListener('click', () => {
            completeTask(task.id);
            navPanel.classList.add('hidden');
        });
    }
    
    // 聚焦地图到导航区域
    if (window.moveMapToPosition) {
        // 计算路线中心点
        const centerLng = (DriverState.currentPosition[0] + task.position[0]) / 2;
        const centerLat = (DriverState.currentPosition[1] + task.position[1]) / 2;
        
        // 设置地图中心和缩放级别
        window.moveMapToPosition('driver-map', [centerLng, centerLat], 13);
    }
}

/**
 * 更新导航信息
 */
function updateNavigationInfo() {
    // 如果没有当前路线，或者没有导航面板，直接返回
    const navPanel = document.querySelector('.navigation-panel');
    if (!DriverState.currentRoute || !navPanel || navPanel.classList.contains('hidden')) return;
    
    // 计算与目的地距离
    const distance = calculateDistance(
        DriverState.currentPosition[0],
        DriverState.currentPosition[1],
        DriverState.currentRoute.destination[0],
        DriverState.currentRoute.destination[1]
    );
    
    // 计算剩余时间（假设平均速度30km/h）
    const timeMinutes = Math.ceil((distance / 30) * 60);
    
    // 更新导航面板显示
    const distanceElement = navPanel.querySelector('.nav-distance');
    const timeElement = navPanel.querySelector('.nav-time');
    
    if (distanceElement) {
        distanceElement.textContent = distance < 1 ? 
            `${Math.round(distance * 1000)}米` : 
            `${distance.toFixed(1)}公里`;
    }
    
    if (timeElement) {
        timeElement.textContent = `${timeMinutes}分钟`;
    }
    
    // 如果距离小于100米，提示已接近目的地
    if (distance < 0.1) {
        const instructionText = navPanel.querySelector('.instruction-text');
        if (instructionText) {
            instructionText.innerHTML = `
                <strong>您已接近目的地</strong><br>
                ${DriverState.currentRoute.address}
            `;
        }
        
        // 显示到达按钮高亮
        const arriveBtn = navPanel.querySelector('.arrive-btn');
        if (arriveBtn) {
            arriveBtn.classList.add('highlight');
        }
    }
}

/**
 * 计算两点间距离（公里）
 * @param {number} lng1 - 起点经度
 * @param {number} lat1 - 起点纬度
 * @param {number} lng2 - 终点经度
 * @param {number} lat2 - 终点纬度
 * @returns {number} 距离（公里）
 */
function calculateDistance(lng1, lat1, lng2, lat2) {
    // 使用简化版的Haversine公式计算球面距离
    const R = 6371; // 地球半径，单位：公里
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * 完成任务
 * @param {string} taskId - 任务ID
 */
function completeTask(taskId) {
    // 查找任务
    const taskIndex = DriverState.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const task = DriverState.tasks[taskIndex];
    
    // 根据任务当前状态执行不同操作
    if (task.status === 'pending') {
        // 开始任务
        task.status = 'in-progress';
        window.showNotification(`已开始${task.type === 'pickup' ? '取货' : '送货'}任务`, 'success');
    } else if (task.status === 'in-progress') {
        // 完成任务
        task.status = 'completed';
        window.showNotification(`${task.type === 'pickup' ? '取货' : '送货'}任务已完成`, 'success');
        
        // 如果是送货任务，可能需要通知订单完成
        if (task.type === 'delivery') {
            // 检查同一订单是否还有未完成任务
            const hasUnfinishedTasks = DriverState.tasks.some(t => 
                t.orderId === task.orderId && 
                t.id !== task.id && 
                t.status !== 'completed'
            );
            
            if (!hasUnfinishedTasks) {
                // 通知订单完成
                simulateServerRequest('order/complete', { orderId: task.orderId })
                    .then(() => {
                        window.showNotification(`订单 ${task.orderId} 已完成递送`, 'success');
                    });
            }
        }
    }
    
    // 更新任务列表
    DriverState.tasks[taskIndex] = task;
    renderTaskList();
    
    // 更新地图显示
    showTasksOnMap();
    
    // 关闭导航面板
    const navPanel = document.querySelector('.navigation-panel');
    if (navPanel) {
        navPanel.classList.add('hidden');
    }
    
    // 如果所有任务都完成，状态改为可接单
    const hasActiveTasks = DriverState.tasks.some(t => t.status !== 'completed');
    if (!hasActiveTasks && DriverState.status !== 'offline') {
        DriverState.status = 'available';
        updateStatusText();
    }
}

/**
 * 取消任务
 * @param {string} taskId - 任务ID
 */
function cancelTask(taskId) {
    // 弹出确认对话框
    if (confirm('确定要取消此任务吗？取消可能会影响您的评分。')) {
        // 找到任务索引
        const taskIndex = DriverState.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        
        const task = DriverState.tasks[taskIndex];
        
        // 发送取消请求
        simulateServerRequest('task/cancel', { taskId, reason: '司机取消' })
            .then(() => {
                // 从任务列表中移除
                DriverState.tasks.splice(taskIndex, 1);
                
                // 更新UI
                renderTaskList();
                showTasksOnMap();
                
                // 如果没有任务了，状态改为可接单
                if (DriverState.tasks.length === 0 && DriverState.status !== 'offline') {
                    DriverState.status = 'available';
                    updateStatusText();
                }
                
                window.showNotification(`已取消任务`, 'info');
            });
    }
}

/**
 * 联系客户
 * @param {string} taskId - 任务ID
 */
function contactCustomer(taskId) {
    // 查找任务
    const task = DriverState.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // 这里可以实现拨打电话或者发送消息的功能
    // 在Web应用中通常是显示联系方式或打开聊天界面
    
    alert(`联系客户：${task.contact}\n电话：${task.phone}`);
}

/**
 * 设置实时更新
 */
function setupRealTimeUpdates() {
    // 实际应用中，这里会使用WebSocket或轮询来获取实时更新
    
    // 模拟定时刷新
    setInterval(() => {
        // 只有在线状态才刷新
        if (DriverState.status !== 'offline') {
            // 随机模拟是否有新订单
            if (DriverState.status === 'available' && Math.random() < 0.1) {
                // 模拟收到新订单
                simulateNewOrder();
            }
            
            // 随机模拟交通状况变化
            if (Math.random() < 0.05) {
                // 模拟交通状况变化
                simulateTrafficChange();
            }
        }
    }, 30000); // 每30秒刷新一次
}

/**
 * 模拟收到新订单
 */
function simulateNewOrder() {
    // 生成模拟订单
    const mockOrder = generateMockOrder();
    
    // 显示订单通知
    showOrderNotification(mockOrder);
}

/**
 * 生成模拟订单
 * @returns {Object} 模拟订单数据
 */
function generateMockOrder() {
    // 生成订单ID
    const orderId = 'OD' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    // 生成随机位置
    const centerLng = window.CONFIG.DEFAULT_CENTER[0];
    const centerLat = window.CONFIG.DEFAULT_CENTER[1];
    
    const pickupOffsetLng = (Math.random() - 0.5) * 0.05;
    const pickupOffsetLat = (Math.random() - 0.5) * 0.05;
    
    const deliveryOffsetLng = (Math.random() - 0.5) * 0.05;
    const deliveryOffsetLat = (Math.random() - 0.5) * 0.05;
    
    // 计算两点间距离
    const distance = calculateDistance(
        centerLng + pickupOffsetLng,
        centerLat + pickupOffsetLat,
        centerLng + deliveryOffsetLng,
        centerLat + deliveryOffsetLat
    );
    
    // 随机生成客户姓氏
    const surnames = ['张', '王', '李', '赵', '陈', '刘', '杨', '黄', '周', '吴'];
    const pickupContact = surnames[Math.floor(Math.random() * surnames.length)] + '先生';
    const deliveryContact = surnames[Math.floor(Math.random() * surnames.length)] + '女士';
    
    // 货物类型
    const cargoTypes = ['小件快递', '中型包裹', '大件物品', '文件袋', '生鲜食品'];
    const cargoType = cargoTypes[Math.floor(Math.random() * cargoTypes.length)];
    
    // 生成订单数据
    return {
        orderId,
        distance: distance.toFixed(1),
        estimatedIncome: Math.round(15 + distance * 2),
        pickup: {
            address: `东营区某某街道${Math.floor(Math.random() * 100) + 1}号`,
            contact: pickupContact,
            phone: `1${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
            position: [centerLng + pickupOffsetLng, centerLat + pickupOffsetLat]
        },
        delivery: {
            address: `东营区另一街道${Math.floor(Math.random() * 100) + 1}号`,
            contact: deliveryContact,
            phone: `1${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
            position: [centerLng + deliveryOffsetLng, centerLat + deliveryOffsetLat]
        },
        cargoType,
        urgency: Math.random() < 0.3 ? '加急' : '普通'
    };
}

/**
 * 显示订单通知
 * @param {Object} order - 订单信息
 */
function showOrderNotification(order) {
    // 创建订单通知元素
    const notification = document.createElement('div');
    notification.className = 'order-notification';
    notification.innerHTML = `
        <div class="notification-header">
            <h3>新订单</h3>
            <span class="notification-close">×</span>
        </div>
        <div class="notification-body">
            <div class="order-info">
                <div class="order-id">订单号: ${order.orderId}</div>
                <div class="order-route">
                    <div class="pickup">取: ${order.pickup.address}</div>
                    <div class="delivery">送: ${order.delivery.address}</div>
                </div>
                <div class="order-details">
                    <div>距离: ${order.distance}公里</div>
                    <div>物品: ${order.cargoType}</div>
                    <div>类型: ${order.urgency}</div>
                </div>
                <div class="order-income">
                    预计收入: ¥${order.estimatedIncome}
                </div>
            </div>
        </div>
        <div class="notification-footer">
            <button class="secondary-btn reject-btn">拒绝</button>
            <button class="primary-btn accept-btn">接单</button>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 播放提示音
    playNotificationSound();
    
    // 绑定事件
    const closeBtn = notification.querySelector('.notification-close');
    const rejectBtn = notification.querySelector('.reject-btn');
    const acceptBtn = notification.querySelector('.accept-btn');
    
    // 关闭通知
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    // 拒绝订单
    rejectBtn.addEventListener('click', () => {
        notification.remove();
        window.showNotification('已拒绝订单', 'info');
    });
    
    // 接受订单
    acceptBtn.addEventListener('click', () => {
        notification.remove();
        acceptOrder(order);
    });
    
    // 15秒后自动关闭
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.remove();
        }
    }, 15000);
}

/**
 * 播放通知提示音
 */
function playNotificationSound() {
    // 创建音频元素
    const audio = new Audio('assets/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('无法播放提示音：', e));
}

/**
 * 接受订单
 * @param {Object} order - 订单信息
 */
function acceptOrder(order) {
    // 显示加载状态
    window.showNotification('正在处理订单...', 'info');
    
    // 模拟API请求
    simulateServerRequest('order/accept', { orderId: order.orderId })
        .then(() => {
            // 创建新任务
            const pickupTask = {
                id: `pickup-${order.orderId}`,
                orderId: order.orderId,
                type: 'pickup',
                status: 'pending',
                address: order.pickup.address,
                contact: order.pickup.contact,
                phone: order.pickup.phone,
                position: order.pickup.position,
                estimatedMinutes: Math.ceil(calculateDistance(
                    DriverState.currentPosition[0],
                    DriverState.currentPosition[1],
                    order.pickup.position[0],
                    order.pickup.position[1]
                ) / 30 * 60),
                cargoInfo: `${order.cargoType} (${order.urgency})`
            };
            
            const deliveryTask = {
                id: `delivery-${order.orderId}`,
                orderId: order.orderId,
                type: 'delivery',
                status: 'pending',
                address: order.delivery.address,
                contact: order.delivery.contact,
                phone: order.delivery.phone,
                position: order.delivery.position,
                estimatedMinutes: Math.ceil(calculateDistance(
                    order.pickup.position[0],
                    order.pickup.position[1],
                    order.delivery.position[0],
                    order.delivery.position[1]
                ) / 30 * 60) + pickupTask.estimatedMinutes,
                cargoInfo: `${order.cargoType} (${order.urgency})`
            };
            
            // 添加到任务列表
            DriverState.tasks.push(pickupTask, deliveryTask);
            
            // 更改状态为忙碌
            if (DriverState.status !== 'offline') {
                DriverState.status = 'busy';
                updateStatusText();
            }
            
            // 更新任务列表
            renderTaskList();
            
            // 更新地图显示
            showTasksOnMap();
            
            window.showNotification('订单接受成功！已添加到您的任务列表', 'success');
        })
        .catch(() => {
            window.showNotification('接单失败，请稍后再试', 'error');
        });
}

/**
 * 模拟交通状况变化
 */
function simulateTrafficChange() {
    // 只有在忙碌状态时，才提示交通变化
    if (DriverState.status !== 'busy' || !DriverState.currentRoute) return;
    
    // 随机生成交通状况
    const trafficConditions = [
        { type: 'congestion', message: '前方路段拥堵，建议改道' },
        { type: 'accident', message: '前方发生交通事故，请绕行' },
        { type: 'roadwork', message: '前方道路施工，临时封闭' },
        { type: 'weather', message: '注意天气变化，请小心行驶' }
    ];
    
    const randomCondition = trafficConditions[Math.floor(Math.random() * trafficConditions.length)];
    
    // 创建交通提醒元素
    const trafficAlert = document.createElement('div');
    trafficAlert.className = 'traffic-alert';
    trafficAlert.innerHTML = `
        <div class="alert-icon ${randomCondition.type}">
            <i class="fa fa-exclamation-triangle"></i>
        </div>
        <div class="alert-content">
            <h4>交通提醒</h4>
            <p>${randomCondition.message}</p>
        </div>
        <button class="alert-close">×</button>
    `;
    
    // 添加到页面
    document.body.appendChild(trafficAlert);
    
    // 绑定关闭事件
    trafficAlert.querySelector('.alert-close').addEventListener('click', () => {
        trafficAlert.remove();
    });
    
    // 10秒后自动关闭
    setTimeout(() => {
        if (document.body.contains(trafficAlert)) {
            trafficAlert.classList.add('fadeout');
            setTimeout(() => trafficAlert.remove(), 500);
        }
    }, 10000);
    
    // 播放提示音
    const audio = new Audio('assets/sounds/alert.mp3');
    audio.volume = 0.3;
    audio.play().catch(e => console.log('无法播放提示音：', e));
}

/**
 * 监听路线计算完成事件
 */
function listenForRouteEvents() {
    document.addEventListener('routeCalculated', (e) => {
        const { routeId, distance, duration } = e.detail;
        
        // 更新导航面板信息
        const navPanel = document.querySelector('.navigation-panel');
        if (navPanel && !navPanel.classList.contains('hidden')) {
            const distanceElement = navPanel.querySelector('.nav-distance');
            const timeElement = navPanel.querySelector('.nav-time');
            
            if (distanceElement && distance) {
                const distanceKm = distance / 1000;
                distanceElement.textContent = distanceKm < 1 ? 
                    `${Math.round(distance)}米` : 
                    `${distanceKm.toFixed(1)}公里`;
            }
            
            if (timeElement && duration) {
                const durationMinutes = Math.ceil(duration / 60);
                timeElement.textContent = `${durationMinutes}分钟`;
            }
            
            // 更新导航指令
            const instructionsElement = navPanel.querySelector('.nav-instructions');
            if (instructionsElement) {
                // 这里可以根据路线信息生成详细的导航指令
                instructionsElement.innerHTML = `
                    <div class="nav-instruction">
                        <div class="instruction-icon">
                            <i class="fa fa-arrow-right"></i>
                        </div>
                        <div class="instruction-text">
                            沿当前道路行驶约${Math.round(distance / 1000)}公里
                        </div>
                    </div>
                `;
            }
        }
    });
}

/**
 * 订阅订单匹配事件
 */
function subscribeToOrderMatching() {
    // 在实际应用中，这里会使用WebSocket或其他实时通信技术
    // 监听来自调度系统的订单匹配消息
    
    // 这里我们使用自定义事件模拟
    document.addEventListener('orderMatched', (e) => {
        const { order } = e.detail;
        
        // 如果司机在线且可接单，显示订单通知
        if (DriverState.status === 'available') {
            showOrderNotification(order);
        }
    });
}

/**
 * 模拟服务器请求
 * @param {string} endpoint - API端点
 * @param {Object} data - 请求数据
 * @returns {Promise} 请求Promise
 */
function simulateServerRequest(endpoint, data) {
    return new Promise((resolve) => {
        console.log(`模拟请求: ${endpoint}`, data);
        
        // 模拟网络延迟
        setTimeout(() => {
            // 根据不同端点返回不同模拟数据
            switch (endpoint) {
                case 'driver/tasks':
                    resolve(generateMockTasks());
                    break;
                default:
                    resolve({ success: true });
            }
        }, 800);
    });
}

/**
 * 生成模拟任务
 * @returns {Array} 任务列表
 */
function generateMockTasks() {
    // 如果是首次加载，生成随机任务
    // 在实际应用中，这些数据会从服务器获取
    
    // 生成1-2个订单
    const tasks = [];
    const numOrders = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < numOrders; i++) {
        const orderId = `ORDER${10000 + i}`;
        
        // 生成取货点和送货点
        const centerLng = window.CONFIG.DEFAULT_CENTER[0];
        const centerLat = window.CONFIG.DEFAULT_CENTER[1];
        
        const pickupOffsetLng = (Math.random() - 0.5) * 0.05;
        const pickupOffsetLat = (Math.random() - 0.5) * 0.05;
        
        const deliveryOffsetLng = (Math.random() - 0.5) * 0.05;
        const deliveryOffsetLat = (Math.random() - 0.5) * 0.05;
        
        // 任务状态
        const taskStatus = i === 0 ? 'in-progress' : 'pending';
        
        // 客户信息
        const surnames = ['张', '王', '李', '赵', '陈'];
        const pickupContact = surnames[Math.floor(Math.random() * surnames.length)] + '先生';
        const deliveryContact = surnames[Math.floor(Math.random() * surnames.length)] + '女士';
        
        // 取货任务
        tasks.push({
            id: `pickup-${orderId}`,
            orderId: orderId,
            type: 'pickup',
            status: taskStatus,
            address: '东营区某某街道' + (Math.floor(Math.random() * 100) + 1) + '号',
            contact: pickupContact,
            phone: '138****' + Math.floor(Math.random() * 10000),
            position: [centerLng + pickupOffsetLng, centerLat + pickupOffsetLat],
            estimatedMinutes: Math.floor(Math.random() * 15) + 5,
            cargoInfo: `${Math.random() < 0.5 ? '小件快递' : '中型包裹'} (${Math.random() < 0.3 ? '加急' : '普通'})`
        });
        
        // 送货任务
        tasks.push({
            id: `delivery-${orderId}`,
            orderId: orderId,
            type: 'delivery',
            status: 'pending',
            address: '东营区另一街道' + (Math.floor(Math.random() * 100) + 1) + '号',
            contact: deliveryContact,
            phone: '137****' + Math.floor(Math.random() * 10000),
            position: [centerLng + deliveryOffsetLng, centerLat + deliveryOffsetLat],
            estimatedMinutes: Math.floor(Math.random() * 20) + 15,
            cargoInfo: tasks[0] ? tasks[0].cargoInfo : '标准包裹'
        });
    }
    
    return tasks;
}

// 导出全局访问函数
window.initDriverInterface = initDriverInterface;
/**
 * user-interface.js
 * 智送城市货运调度系统 - 用户界面逻辑
 */

// 用户状态管理
const UserState = {
    // 当前登录用户信息
    user: {
        id: null,
        name: '',
        phone: '',
        addresses: []
    },
    // 当前视图: 'order'(下单), 'tracking'(追踪), 'history'(历史订单)
    currentView: 'order',
    // 当前选择的地址
    selectedAddresses: {
        pickup: null,
        delivery: null
    },
    // 当前订单表单数据
    orderForm: {
        cargoType: 'small', // 'small', 'medium', 'large'
        weight: 1,
        urgent: false,
        scheduledTime: null,
        remarks: ''
    },
    // 费用估算
    costEstimate: {
        basePrice: 0,
        distancePrice: 0,
        cargoPrice: 0,
        urgentPrice: 0,
        totalPrice: 0,
        distance: 0,
        estimatedTime: 0
    },
    // 当前追踪的订单
    trackingOrder: null,
    // 历史订单
    orderHistory: [],
    // 地址搜索结果
    addressSearchResults: [],
    // 地图实例
    map: null
};

/**
 * 初始化用户界面
 */
function initUserInterface() {
    console.log('初始化用户界面...');
    
    // 加载用户信息
    loadUserData();
    
    // 初始化视图
    initViews();
    
    // 设置导航菜单事件
    setupNavigation();
    
    // 初始化地图
    initMap();
    
    // 设置表单事件
    setupFormEvents();
    
    // 初始化默认视图
    switchView(UserState.currentView);
}

/**
 * 加载用户数据
 */
function loadUserData() {
    // 在实际应用中，这里会从API获取用户数据
    // 这里使用模拟数据
    const mockUser = {
        id: 'U' + Math.floor(Math.random() * 10000),
        name: '张三',
        phone: '13800138000',
        addresses: [
            { 
                id: 'addr1', 
                name: '家', 
                address: '北京市朝阳区建国路88号', 
                location: [116.480983, 39.989628],
                isFrequent: true
            },
            { 
                id: 'addr2', 
                name: '公司', 
                address: '北京市海淀区中关村南大街5号', 
                location: [116.314428, 39.998081],
                isFrequent: true
            },
            { 
                id: 'addr3', 
                name: '父母家', 
                address: '北京市西城区西长安街1号', 
                location: [116.323066, 39.906542],
                isFrequent: false
            }
        ]
    };
    
    UserState.user = mockUser;
    
    // 加载历史订单
    loadOrderHistory();
    
    // 更新用户信息显示
    updateUserInfoDisplay();
}

/**
 * 加载历史订单
 */
function loadOrderHistory() {
    // 在实际应用中，这里会从API获取历史订单
    // 这里使用模拟数据或mock-data.js中的数据
    
    if (window.getMockUserOrders) {
        // 如果mock-data.js已加载，使用它的模拟订单
        UserState.orderHistory = window.getMockUserOrders(UserState.user.id);
    } else {
        // 否则使用本地模拟数据
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        UserState.orderHistory = [
            {
                id: 'O12345',
                pickupAddress: '北京市朝阳区建国路88号',
                deliveryAddress: '北京市海淀区中关村南大街5号',
                createdAt: today,
                status: 'in-progress',
                price: 35.50,
                cargoType: 'small',
                distance: 8.5,
                estimatedDelivery: new Date(today.getTime() + 30 * 60000),
                assignedVehicle: 'V001',
                trackingInfo: {
                    currentLocation: [116.397428, 39.909728],
                    updatedAt: new Date()
                }
            },
            {
                id: 'O12344',
                pickupAddress: '北京市西城区西长安街1号',
                deliveryAddress: '北京市朝阳区建国路88号',
                createdAt: yesterday,
                status: 'completed',
                price: 42.00,
                cargoType: 'medium',
                distance: 10.2,
                completedAt: new Date(yesterday.getTime() + 45 * 60000),
                assignedVehicle: 'V003'
            },
            {
                id: 'O12343',
                pickupAddress: '北京市朝阳区建国路88号',
                deliveryAddress: '北京市海淀区中关村南大街5号',
                createdAt: lastWeek,
                status: 'completed',
                price: 38.50,
                cargoType: 'small',
                distance: 8.5,
                completedAt: new Date(lastWeek.getTime() + 40 * 60000),
                assignedVehicle: 'V002'
            }
        ];
    }
    
    // 检查是否有进行中的订单，如果有，默认切换到追踪视图
    const activeOrder = UserState.orderHistory.find(order => 
        order.status === 'pending' || order.status === 'in-progress');
    
    if (activeOrder) {
        UserState.trackingOrder = activeOrder;
        UserState.currentView = 'tracking';
    }
}

/**
 * 更新用户信息显示
 */
function updateUserInfoDisplay() {
    // 更新用户名显示
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
        el.textContent = UserState.user.name;
    });
    
    // 更新常用地址下拉菜单
    updateAddressDropdowns();
}

/**
 * 更新地址下拉菜单
 */
function updateAddressDropdowns() {
    const pickupSelect = document.getElementById('pickup-address-select');
    const deliverySelect = document.getElementById('delivery-address-select');
    
    if (pickupSelect && UserState.user.addresses) {
        // 清空现有选项
        pickupSelect.innerHTML = '<option value="">请选择取货地址或搜索新地址</option>';
        
        // 添加常用地址
        UserState.user.addresses.forEach(address => {
            const option = document.createElement('option');
            option.value = address.id;
            option.textContent = `${address.name}: ${address.address}`;
            pickupSelect.appendChild(option);
        });
    }
    
    if (deliverySelect && UserState.user.addresses) {
        // 清空现有选项
        deliverySelect.innerHTML = '<option value="">请选择送货地址或搜索新地址</option>';
        
        // 添加常用地址
        UserState.user.addresses.forEach(address => {
            const option = document.createElement('option');
            option.value = address.id;
            option.textContent = `${address.name}: ${address.address}`;
            deliverySelect.appendChild(option);
        });
    }
}

/**
 * 初始化视图
 */
function initViews() {
    // 获取所有视图容器
    const viewContainers = document.querySelectorAll('.view-container');
    
    // 初始默认隐藏所有视图
    viewContainers.forEach(container => {
        container.style.display = 'none';
    });
}

/**
 * 设置导航菜单事件
 */
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // 获取目标视图
            const targetView = e.currentTarget.getAttribute('data-view');
            
            // 切换视图
            switchView(targetView);
            
            // 更新导航项的激活状态
            navItems.forEach(navItem => {
                navItem.classList.remove('active');
            });
            e.currentTarget.classList.add('active');
        });
    });
}

/**
 * 切换视图
 * @param {string} viewName - 视图名称
 */
function switchView(viewName) {
    // 保存当前视图
    UserState.currentView = viewName;
    
    // 隐藏所有视图
    const viewContainers = document.querySelectorAll('.view-container');
    viewContainers.forEach(container => {
        container.style.display = 'none';
    });
    
    // 显示目标视图
    const targetContainer = document.getElementById(`${viewName}-view`);
    if (targetContainer) {
        targetContainer.style.display = 'block';
    }
    
    // 根据视图执行特定的初始化逻辑
    if (viewName === 'order') {
        initOrderForm();
        updateCostEstimate();
    } else if (viewName === 'tracking') {
        initTrackingView();
    } else if (viewName === 'history') {
        displayOrderHistory();
    }
    
    // 更新地图显示
    updateMapForCurrentView();
}

/**
 * 初始化地图
 */
function initMap() {
    // 获取地图容器
    const mapContainer = document.getElementById('user-map');
    if (!mapContainer) return;
    
    // 如果地图模块可用
    if (window.initializeMap) {
        // 创建地图实例
        UserState.map = window.initializeMap('user-map', [116.397428, 39.909728], 12);
        
        // 注册地图点击事件，用于选择地址
        if (UserState.map && window.registerMapClickEvent) {
            window.registerMapClickEvent(UserState.map, 'user', handleMapClick);
        }
        
        // 添加地图控件
        if (window.addMapControls) {
            window.addMapControls(UserState.map);
        }
    } else {
        // 地图模块不可用，显示占位图
        mapContainer.innerHTML = `
            <div class="map-placeholder">
                <div class="map-message">地图加载中...</div>
            </div>
        `;
    }
}

/**
 * 处理地图点击事件
 * @param {Object} e - 点击事件
 */
function handleMapClick(e) {
    // 仅在下单视图时处理地图点击
    if (UserState.currentView !== 'order') return;
    
    // 获取点击位置的坐标
    const position = e.lnglat.getLng ? [e.lnglat.getLng(), e.lnglat.getLat()] : e.lnglat;
    
    // 获取当前焦点的地址输入框
    const activeAddressInput = document.querySelector('.address-input:focus');
    if (!activeAddressInput) return;
    
    // 解析坐标到地址
    geocodePosition(position, (address) => {
        // 显示解析后的地址
        if (activeAddressInput.id === 'pickup-address') {
            selectPickupAddress(address, position);
        } else if (activeAddressInput.id === 'delivery-address') {
            selectDeliveryAddress(address, position);
        }
    });
}

/**
 * 坐标转地址
 * @param {Array} position - 位置坐标 [经度, 纬度]
 * @param {Function} callback - 回调函数
 */
function geocodePosition(position, callback) {
    // 在实际应用中，这里会调用地图API进行坐标转地址
    // 这里使用模拟数据
    setTimeout(() => {
        // 模拟地址解析结果
        const address = `北京市某区某街道${Math.floor(Math.random() * 100)}号`;
        callback(address);
    }, 300);
}

/**
 * 根据当前视图更新地图
 */
function updateMapForCurrentView() {
    if (!UserState.map) return;
    
    // 清除地图上的所有标记
    if (window.clearMapMarkers) {
        window.clearMapMarkers('user');
    }
    
    if (UserState.currentView === 'order') {
        // 在下单视图中显示已选择的地址
        updateOrderMapMarkers();
    } else if (UserState.currentView === 'tracking') {
        // 在追踪视图中显示订单和车辆位置
        updateTrackingMapMarkers();
    } else if (UserState.currentView === 'history') {
        // 历史订单视图不需要特殊处理地图
    }
}

/**
 * 更新下单视图的地图标记
 */
function updateOrderMapMarkers() {
    if (!UserState.map) return;
    
    // 添加取货地址标记
    if (UserState.selectedAddresses.pickup && window.addOrderMarker) {
        window.addOrderMarker(UserState.map, {
            id: 'pickup',
            position: UserState.selectedAddresses.pickup.location,
            title: '取货点: ' + UserState.selectedAddresses.pickup.address,
            type: 'pickup'
        });
    }
    
    // 添加送货地址标记
    if (UserState.selectedAddresses.delivery && window.addOrderMarker) {
        window.addOrderMarker(UserState.map, {
            id: 'delivery',
            position: UserState.selectedAddresses.delivery.location,
            title: '送货点: ' + UserState.selectedAddresses.delivery.address,
            type: 'delivery'
        });
    }
    
    // 如果两个地址都已选择，绘制路线并调整地图视野
    if (UserState.selectedAddresses.pickup && UserState.selectedAddresses.delivery) {
        if (window.planRoute) {
            window.planRoute(
                UserState.map, 
                UserState.selectedAddresses.pickup.location, 
                UserState.selectedAddresses.delivery.location,
                {
                    onResult: (result) => {
                        // 更新距离和时间估计
                        if (result && result.distance) {
                            UserState.costEstimate.distance = result.distance;
                            UserState.costEstimate.estimatedTime = result.duration;
                            updateCostEstimate();
                        }
                    }
                }
            );
        }
        
        // 调整地图视野以包含两个标记点
        const bounds = new AMap.Bounds([
            UserState.selectedAddresses.pickup.location,
            UserState.selectedAddresses.delivery.location
        ]);
        UserState.map.setBounds(bounds, true, [30, 30, 30, 30]);
    }
}

/**
 * 更新追踪视图的地图标记
 */
function updateTrackingMapMarkers() {
    if (!UserState.map || !UserState.trackingOrder) return;
    
    const order = UserState.trackingOrder;
    
    // 添加取货点标记
    if (order.pickupPosition && window.addOrderMarker) {
        window.addOrderMarker(UserState.map, {
            id: 'tracking-pickup',
            position: order.pickupPosition,
            title: '取货点: ' + order.pickupAddress,
            type: 'pickup'
        });
    }
    
    // 添加送货点标记
    if (order.deliveryPosition && window.addOrderMarker) {
        window.addOrderMarker(UserState.map, {
            id: 'tracking-delivery',
            position: order.deliveryPosition,
            title: '送货点: ' + order.deliveryAddress,
            type: 'delivery'
        });
    }
    
    // 添加车辆位置标记
    if (order.trackingInfo && order.trackingInfo.currentLocation && window.addVehicleMarker) {
        window.addVehicleMarker(UserState.map, {
            id: order.assignedVehicle,
            position: order.trackingInfo.currentLocation,
            status: 'busy',
            title: `车辆 ${order.assignedVehicle}`
        });
    }
    
    // 绘制路线
    if (window.planRoute && order.trackingInfo && order.trackingInfo.currentLocation) {
        // 绘制车辆到取货点路线（如果订单状态是等待取货）
        if (order.status === 'pending' || order.status === 'assigned') {
            window.planRoute(
                UserState.map,
                order.trackingInfo.currentLocation,
                order.pickupPosition,
                { 
                    strokeColor: '#3370FF',
                    strokeWeight: 6,
                    strokeOpacity: 0.6
                }
            );
        }
        
        // 绘制取货点到送货点路线
        if (order.status === 'in-progress') {
            window.planRoute(
                UserState.map,
                order.trackingInfo.currentLocation,
                order.deliveryPosition,
                { 
                    strokeColor: '#FF5733',
                    strokeWeight: 6,
                    strokeOpacity: 0.6
                }
            );
        }
    }
    
    // 调整地图视野
    const locations = [
        order.pickupPosition,
        order.deliveryPosition
    ];
    
    if (order.trackingInfo && order.trackingInfo.currentLocation) {
        locations.push(order.trackingInfo.currentLocation);
    }
    
    const bounds = new AMap.Bounds(locations);
    UserState.map.setBounds(bounds, true, [50, 50, 50, 50]);
}

/**
 * 设置表单事件
 */
function setupFormEvents() {
    // 地址选择下拉框变化事件
    const pickupSelect = document.getElementById('pickup-address-select');
    if (pickupSelect) {
        pickupSelect.addEventListener('change', () => {
            const selectedId = pickupSelect.value;
            if (selectedId) {
                const selectedAddress = UserState.user.addresses.find(addr => addr.id === selectedId);
                if (selectedAddress) {
                    selectPickupAddress(selectedAddress.address, selectedAddress.location);
                }
            }
        });
    }
    
    const deliverySelect = document.getElementById('delivery-address-select');
    if (deliverySelect) {
        deliverySelect.addEventListener('change', () => {
            const selectedId = deliverySelect.value;
            if (selectedId) {
                const selectedAddress = UserState.user.addresses.find(addr => addr.id === selectedId);
                if (selectedAddress) {
                    selectDeliveryAddress(selectedAddress.address, selectedAddress.location);
                }
            }
        });
    }
    
    // 地址输入框事件
    const pickupInput = document.getElementById('pickup-address');
    if (pickupInput) {
        pickupInput.addEventListener('input', debounce(function() {
            searchAddress(pickupInput.value, 'pickup');
        }, 500));
    }
    
    const deliveryInput = document.getElementById('delivery-address');
    if (deliveryInput) {
        deliveryInput.addEventListener('input', debounce(function() {
            searchAddress(deliveryInput.value, 'delivery');
        }, 500));
    }
    
    // 货物类型选择事件
    const cargoTypeRadios = document.querySelectorAll('input[name="cargo-type"]');
    cargoTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            UserState.orderForm.cargoType = radio.value;
            updateCostEstimate();
        });
    });
    
    // 货物重量滑块事件
    const weightSlider = document.getElementById('cargo-weight');
    const weightOutput = document.getElementById('weight-value');
    if (weightSlider && weightOutput) {
        weightSlider.addEventListener('input', () => {
            const weight = parseFloat(weightSlider.value);
            UserState.orderForm.weight = weight;
            weightOutput.textContent = weight + ' 公斤';
            updateCostEstimate();
        });
    }
    
    // 紧急程度复选框事件
    const urgentCheckbox = document.getElementById('urgent-delivery');
    if (urgentCheckbox) {
        urgentCheckbox.addEventListener('change', () => {
            UserState.orderForm.urgent = urgentCheckbox.checked;
            updateCostEstimate();
        });
    }
    
    // 预约时间选择事件
    const scheduledTimeInput = document.getElementById('scheduled-time');
    if (scheduledTimeInput) {
        scheduledTimeInput.addEventListener('change', () => {
            UserState.orderForm.scheduledTime = scheduledTimeInput.value ? new Date(scheduledTimeInput.value) : null;
        });
    }
    
    // 备注输入框事件
    const remarksTextarea = document.getElementById('order-remarks');
    if (remarksTextarea) {
        remarksTextarea.addEventListener('input', () => {
            UserState.orderForm.remarks = remarksTextarea.value;
        });
    }
    
    // 提交订单按钮事件
    const submitOrderBtn = document.getElementById('submit-order');
    if (submitOrderBtn) {
        submitOrderBtn.addEventListener('click', validateAndSubmitOrder);
    }
    
    // 历史订单查看详情按钮事件
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-order-btn')) {
            const orderId = e.target.getAttribute('data-order-id');
            viewOrderDetails(orderId);
        } else if (e.target.classList.contains('track-order-btn')) {
            const orderId = e.target.getAttribute('data-order-id');
            trackOrder(orderId);
        }
    });
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Function} 防抖处理后的函数
 */
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

/**
 * 搜索地址
 * @param {string} query - 搜索关键词
 * @param {string} type - 地址类型 'pickup'或'delivery'
 */
function searchAddress(query, type) {
    if (!query.trim()) {
        // 清空搜索结果
        hideAddressSearchResults(type);
        return;
    }
    
    // 在实际应用中，这里会调用地图API搜索地址
    // 这里使用模拟数据
    setTimeout(() => {
        // 模拟搜索结果
        const results = [
            {
                id: `search-${Date.now()}-1`,
                address: `${query}附近的地址1`,
                location: [116.397428 + Math.random() * 0.1 - 0.05, 39.909728 + Math.random() * 0.1 - 0.05]
            },
            {
                id: `search-${Date.now()}-2`,
                address: `${query}附近的地址2`,
                location: [116.397428 + Math.random() * 0.1 - 0.05, 39.909728 + Math.random() * 0.1 - 0.05]
            },
            {
                id: `search-${Date.now()}-3`,
                address: `${query}附近的地址3`,
                location: [116.397428 + Math.random() * 0.1 - 0.05, 39.909728 + Math.random() * 0.1 - 0.05]
            }
        ];
        
        displayAddressSearchResults(results, type);
    }, 300);
}

/**
 * 显示地址搜索结果
 * @param {Array} results - 搜索结果数组
 * @param {string} type - 地址类型 'pickup'或'delivery'
 */
function displayAddressSearchResults(results, type) {
    const resultsContainer = document.getElementById(`${type}-address-results`);
    if (!resultsContainer) return;
    
    // 保存搜索结果
    UserState.addressSearchResults = results;
    
    // 生成结果列表HTML
    const resultsHTML = results.map((result, index) => `
        <div class="address-result-item" data-index="${index}">
            <i class="fa fa-map-marker-alt"></i>
            <span>${result.address}</span>
        </div>
    `).join('');
    
    // 显示结果
    resultsContainer.innerHTML = resultsHTML;
    resultsContainer.style.display = 'block';
    
    // 添加点击事件
    const resultItems = resultsContainer.querySelectorAll('.address-result-item');
    resultItems.forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.getAttribute('data-index'));
            const selectedResult = results[index];
            
            if (type === 'pickup') {
                selectPickupAddress(selectedResult.address, selectedResult.location);
            } else {
                selectDeliveryAddress(selectedResult.address, selectedResult.location);
            }
            
            // 隐藏结果列表
            hideAddressSearchResults(type);
        });
    });
}

/**
 * 隐藏地址搜索结果
 * @param {string} type - 地址类型 'pickup'或'delivery'
 */
function hideAddressSearchResults(type) {
    const resultsContainer = document.getElementById(`${type}-address-results`);
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

/**
 * 选择取货地址
 * @param {string} address - 地址文本
 * @param {Array} location - 地址坐标 [经度, 纬度]
 */
function selectPickupAddress(address, location) {
    // 更新输入框
    const pickupInput = document.getElementById('pickup-address');
    if (pickupInput) {
        pickupInput.value = address;
    }
    
    // 更新状态
    UserState.selectedAddresses.pickup = {
        address,
        location
    };
    
    // 更新地图标记
    updateOrderMapMarkers();
    
    // 计算费用
    updateCostEstimate();
}

/**
 * 选择送货地址
 * @param {string} address - 地址文本
 * @param {Array} location - 地址坐标 [经度, 纬度]
 */
function selectDeliveryAddress(address, location) {
    // 更新输入框
    const deliveryInput = document.getElementById('delivery-address');
    if (deliveryInput) {
        deliveryInput.value = address;
    }
    
    // 更新状态
    UserState.selectedAddresses.delivery = {
        address,
        location
    };
    
    // 更新地图标记
    updateOrderMapMarkers();
    
    // 计算费用
    updateCostEstimate();
}

/**
 * 初始化订单表单
 */
function initOrderForm() {
    // 重置表单值
    const pickupInput = document.getElementById('pickup-address');
    const deliveryInput = document.getElementById('delivery-address');
    const smallCargoRadio = document.getElementById('cargo-small');
    const weightSlider = document.getElementById('cargo-weight');
    const weightOutput = document.getElementById('weight-value');
    const urgentCheckbox = document.getElementById('urgent-delivery');
    const scheduledTimeInput = document.getElementById('scheduled-time');
    const remarksTextarea = document.getElementById('order-remarks');
    
    // 重置地址输入
    if (pickupInput) pickupInput.value = '';
    if (deliveryInput) deliveryInput.value = '';
    
    // 重置货物类型为小件
    if (smallCargoRadio) smallCargoRadio.checked = true;
    
    // 重置重量为1公斤
    if (weightSlider) weightSlider.value = 1;
    if (weightOutput) weightOutput.textContent = '1 公斤';
    
    // 重置紧急程度
    if (urgentCheckbox) urgentCheckbox.checked = false;
    
    // 重置预约时间
    if (scheduledTimeInput) scheduledTimeInput.value = '';
    
    // 重置备注
    if (remarksTextarea) remarksTextarea.value = '';
    
    // 重置状态
    UserState.selectedAddresses.pickup = null;
    UserState.selectedAddresses.delivery = null;
    UserState.orderForm = {
        cargoType: 'small',
        weight: 1,
        urgent: false,
        scheduledTime: null,
        remarks: ''
    };
    
    // 更新费用估算
    updateCostEstimate();
    
    // 更新地图
    updateMapForCurrentView();
}

/**
 * 更新费用估算
 */
function updateCostEstimate() {
    // 计算各项费用
    const basePrice = 15; // 基础费用
    let distancePrice = 0;
    let cargoPrice = 0;
    let urgentPrice = 0;
    
    // 距离费用
    if (UserState.costEstimate.distance > 0) {
        distancePrice = Math.round(UserState.costEstimate.distance * 2) / 2 * 2; // 每公里2元
    }
    
    // 货物类型附加费
    switch (UserState.orderForm.cargoType) {
        case 'medium':
            cargoPrice = 5;
            break;
        case 'large':
            cargoPrice = 10;
            break;
        default:
            cargoPrice = 0;
    }
    
    // 货物重量附加费 (超过3公斤部分，每公斤2元)
    if (UserState.orderForm.weight > 3) {
        cargoPrice += Math.ceil(UserState.orderForm.weight - 3) * 2;
    }
    
    // 紧急配送附加费
    if (UserState.orderForm.urgent) {
        urgentPrice = Math.max(10, Math.round((basePrice + distancePrice + cargoPrice) * 0.3)); // 至少10元，或总价的30%
    }
    
    // 计算总价
    const totalPrice = basePrice + distancePrice + cargoPrice + urgentPrice;
    
    // 更新状态
    UserState.costEstimate = {
        ...UserState.costEstimate,
        basePrice,
        distancePrice,
        cargoPrice,
        urgentPrice,
        totalPrice
    };
    
    // 更新UI显示
    updateCostDisplay();
}

/**
 * 更新费用显示
 */
function updateCostDisplay() {
    // 获取费用显示元素
    const basePriceElement = document.getElementById('base-price');
    const distancePriceElement = document.getElementById('distance-price');
    const cargoPriceElement = document.getElementById('cargo-price');
    const urgentPriceElement = document.getElementById('urgent-price');
    const totalPriceElement = document.getElementById('total-price');
    const distanceElement = document.getElementById('estimated-distance');
    const timeElement = document.getElementById('estimated-time');
    
    // 更新费用数值
    if (basePriceElement) 
        basePriceElement.textContent = `¥${UserState.costEstimate.basePrice.toFixed(2)}`;
    
    if (distancePriceElement) 
        distancePriceElement.textContent = `¥${UserState.costEstimate.distancePrice.toFixed(2)}`;
    
    if (cargoPriceElement) 
        cargoPriceElement.textContent = `¥${UserState.costEstimate.cargoPrice.toFixed(2)}`;
    
    if (urgentPriceElement) {
        urgentPriceElement.textContent = `¥${UserState.costEstimate.urgentPrice.toFixed(2)}`;
        // 显示/隐藏紧急费用行
        const urgentRow = document.getElementById('urgent-price-row');
        if (urgentRow) {
            urgentRow.style.display = UserState.orderForm.urgent ? 'table-row' : 'none';
        }
    }
    
    if (totalPriceElement) 
        totalPriceElement.textContent = `¥${UserState.costEstimate.totalPrice.toFixed(2)}`;
    
    // 更新距离和时间
    if (distanceElement) {
        if (UserState.costEstimate.distance > 0) {
            distanceElement.textContent = `${UserState.costEstimate.distance.toFixed(1)} 公里`;
        } else {
            distanceElement.textContent = '请选择地址';
        }
    }
    
    if (timeElement) {
        if (UserState.costEstimate.estimatedTime > 0) {
            const minutes = Math.round(UserState.costEstimate.estimatedTime / 60);
            timeElement.textContent = `约 ${minutes} 分钟`;
        } else {
            timeElement.textContent = '请选择地址';
        }
    }
    
    // 更新提交按钮状态
    const submitBtn = document.getElementById('submit-order');
    if (submitBtn) {
        // 只有当两个地址都选好且有距离时才能提交
        const canSubmit = UserState.selectedAddresses.pickup && 
                          UserState.selectedAddresses.delivery && 
                          UserState.costEstimate.distance > 0;
        
        submitBtn.disabled = !canSubmit;
        
        if (canSubmit) {
            submitBtn.classList.add('active');
        } else {
            submitBtn.classList.remove('active');
        }
    }
}

/**
 * 验证并提交订单
 */
function validateAndSubmitOrder() {
    // 检查是否登录
    if (!UserState.user.id) {
        showNotification('请先登录', 'error');
        return;
    }
    
    // 检查地址是否已选择
    if (!UserState.selectedAddresses.pickup || !UserState.selectedAddresses.delivery) {
        showNotification('请选择取货和送货地址', 'error');
        return;
    }
    
    // 创建订单对象
    const newOrder = {
        userId: UserState.user.id,
        pickupAddress: UserState.selectedAddresses.pickup.address,
        pickupPosition: UserState.selectedAddresses.pickup.location,
        deliveryAddress: UserState.selectedAddresses.delivery.address,
        deliveryPosition: UserState.selectedAddresses.delivery.location,
        cargoType: UserState.orderForm.cargoType,
        weight: UserState.orderForm.weight,
        urgent: UserState.orderForm.urgent,
        scheduledTime: UserState.orderForm.scheduledTime,
        remarks: UserState.orderForm.remarks,
        price: UserState.costEstimate.totalPrice,
        distance: UserState.costEstimate.distance,
        basePrice: UserState.costEstimate.basePrice,
        distancePrice: UserState.costEstimate.distancePrice,
        cargoPrice: UserState.costEstimate.cargoPrice,
        urgentPrice: UserState.costEstimate.urgentPrice,
        estimatedTime: UserState.costEstimate.estimatedTime
    };
    
    // 调用提交订单API
    submitOrder(newOrder);
}

/**
 * 提交订单到服务器
 * @param {Object} order - 订单数据
 */
function submitOrder(order) {
    // 在实际应用中，这里会发送API请求
    // 这里使用模拟
    showLoadingSpinner('正在提交订单...');
    
    setTimeout(() => {
        // 模拟订单成功提交
        hideLoadingSpinner();
        
        // 生成订单ID
        const orderId = 'O' + Date.now().toString().substr(-6);
        
        // 创建完整订单对象
        const completeOrder = {
            ...order,
            id: orderId,
            createdAt: new Date(),
            status: 'pending',
            trackingInfo: {
                currentLocation: [116.397428 + Math.random() * 0.05 - 0.025, 39.909728 + Math.random() * 0.05 - 0.025],
                updatedAt: new Date()
            }
        };
        
        // 添加到历史订单
        UserState.orderHistory.unshift(completeOrder);
        
        // 设置为当前追踪订单
        UserState.trackingOrder = completeOrder;
        
        // 显示成功通知
        showNotification('订单提交成功! 正在为您分配车辆...', 'success');
        
        // 跳转到追踪页面
        showOrderConfirmation(completeOrder);
    }, 1500);
}

/**
 * 显示订单确认
 * @param {Object} order - 订单数据
 */
function showOrderConfirmation(order) {
    // 创建订单确认模态框内容
    const modalContent = `
        <div class="modal-header">
            <h3>订单提交成功</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <div class="order-success-icon">
                <i class="fa fa-check-circle"></i>
            </div>
            <div class="order-info">
                <p>订单编号: <span class="highlight">${order.id}</span></p>
                <p>预计费用: <span class="highlight">¥${order.price.toFixed(2)}</span></p>
                <p>预计送达时间: <span class="highlight">${formatEstimatedDeliveryTime(order.estimatedTime)}</span></p>
            </div>
            <div class="order-addresses">
                <div class="address-item">
                    <div class="address-icon pickup-icon"></div>
                    <div class="address-text">${order.pickupAddress}</div>
                </div>
                <div class="address-item">
                    <div class="address-icon delivery-icon"></div>
                    <div class="address-text">${order.deliveryAddress}</div>
                </div>
            </div>
            <p class="instruction">系统正在为您分配车辆，请稍候...</p>
        </div>
        <div class="modal-footer">
            <button class="secondary-btn" id="track-now-btn">立即追踪</button>
            <button class="primary-btn" id="new-order-btn">再下一单</button>
        </div>
    `;
    
    // 显示模态框
    const modal = showModal(modalContent, 'order-confirmation-modal');
    
    // 绑定按钮事件
    const trackNowBtn = modal.querySelector('#track-now-btn');
    const newOrderBtn = modal.querySelector('#new-order-btn');
    
    if (trackNowBtn) {
        trackNowBtn.addEventListener('click', () => {
            closeModal();
            switchView('tracking');
            
            // 更新导航菜单高亮
            document.querySelectorAll('.nav-item').forEach(item => {
                const view = item.getAttribute('data-view');
                item.classList.toggle('active', view === 'tracking');
            });
        });
    }
    
    if (newOrderBtn) {
        newOrderBtn.addEventListener('click', () => {
            closeModal();
            initOrderForm();
        });
    }
    
    // 模拟分配车辆
    setTimeout(() => {
        // 随机生成司机信息
        const vehicleId = 'V' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const driverNames = ['李师傅', '张师傅', '王师傅', '赵师傅', '刘师傅'];
        const driverName = driverNames[Math.floor(Math.random() * driverNames.length)];
        const vehicleTypes = ['小型货车', '面包车', '电动三轮车'];
        const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        
        // 更新订单信息
        order.status = 'assigned';
        order.assignedVehicle = vehicleId;
        order.assignedAt = new Date();
        order.driverName = driverName;
        order.vehicleType = vehicleType;
        
        // 更新模态框内容
        const instruction = modal.querySelector('.instruction');
        if (instruction) {
            instruction.innerHTML = `
                <div class="driver-assigned">
                    <img src="../assets/icons/driver-avatar.png" class="driver-avatar">
                    <div class="driver-info">
                        <p class="driver-name">${driverName}</p>
                        <p class="vehicle-info">${vehicleType} · ${vehicleId}</p>
                        <p class="eta">预计 ${formatMinutes(5)} 到达取货点</p>
                    </div>
                </div>
            `;
        }
        
        // 显示通知
        showNotification(`已为您分配车辆: ${vehicleId}, 司机: ${driverName}`, 'success');
        
        // 如果用户在追踪页面，更新显示
        if (UserState.currentView === 'tracking') {
            initTrackingView();
        }
    }, 3000);
}

/**
 * 格式化预计送达时间
 * @param {number} estimatedTime - 预计时间(秒)
 * @returns {string} 格式化后的时间
 */
function formatEstimatedDeliveryTime(estimatedTime) {
    const now = new Date();
    const deliveryTime = new Date(now.getTime() + (estimatedTime * 1000));
    
    const hours = deliveryTime.getHours().toString().padStart(2, '0');
    const minutes = deliveryTime.getMinutes().toString().padStart(2, '0');
    
    return `今日 ${hours}:${minutes}`;
}

/**
 * 格式化分钟数
 * @param {number} minutes - 分钟数
 * @returns {string} 格式化后的时间
 */
function formatMinutes(minutes) {
    const now = new Date();
    const futureTime = new Date(now.getTime() + (minutes * 60 * 1000));
    
    const hours = futureTime.getHours().toString().padStart(2, '0');
    const mins = futureTime.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${mins}`;
}

/**
 * 初始化订单追踪视图
 */
function initTrackingView() {
    // 如果没有正在追踪的订单，显示空状态
    if (!UserState.trackingOrder) {
        const trackingContent = document.getElementById('tracking-content');
        if (trackingContent) {
            trackingContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fa fa-map-marked-alt"></i>
                    </div>
                    <h3>没有进行中的订单</h3>
                    <p>当前没有可追踪的订单，请先创建一个新订单</p>
                    <button id="create-order-btn" class="primary-btn">创建订单</button>
                </div>
            `;
            
            // 绑定创建订单按钮
            const createOrderBtn = document.getElementById('create-order-btn');
            if (createOrderBtn) {
                createOrderBtn.addEventListener('click', () => {
                    switchView('order');
                    
                    // 更新导航菜单高亮
                    document.querySelectorAll('.nav-item').forEach(item => {
                        const view = item.getAttribute('data-view');
                        item.classList.toggle('active', view === 'order');
                    });
                });
            }
            
            return;
        }
    }
    
    // 显示正在追踪的订单
    updateTrackingView();
    
    // 更新地图
    updateMapForCurrentView();
    
    // 启动追踪定时器 (每10秒更新一次)
    if (window.trackingInterval) {
        clearInterval(window.trackingInterval);
    }
    
    window.trackingInterval = setInterval(() => {
        updateOrderTracking();
    }, 10000);
}

/**
 * 更新追踪视图
 */
function updateTrackingView() {
    const trackingContent = document.getElementById('tracking-content');
    if (!trackingContent || !UserState.trackingOrder) return;
    
    const order = UserState.trackingOrder;
    
    // 订单追踪状态文本
    let statusText = '等待接单';
    let statusClass = 'pending';
    
    if (order.status === 'assigned') {
        statusText = '司机已接单，前往取货点';
        statusClass = 'assigned';
    } else if (order.status === 'in-progress') {
        statusText = '配送中';
        statusClass = 'in-progress';
    } else if (order.status === 'completed') {
        statusText = '已送达';
        statusClass = 'completed';
    }
    
    // 计算预计到达时间
    let etaText = '计算中...';
    
    if (order.status === 'assigned' && order.assignedAt) {
        // 如果已分配司机，预计5分钟后到达取货点
        const pickupTime = new Date(order.assignedAt);
        pickupTime.setMinutes(pickupTime.getMinutes() + 5);
        etaText = `预计 ${formatTime(pickupTime)} 到达取货点`;
    } else if (order.status === 'in-progress') {
        // 如果在配送中，根据距离和当前时间计算预计送达时间
        const now = new Date();
        const deliveryTime = new Date(now.getTime() + (order.estimatedTime * 1000 / 2)); // 假设已经完成了一半路程
        etaText = `预计 ${formatTime(deliveryTime)} 送达`;
    } else if (order.status === 'completed') {
        // 如果已完成，显示完成时间
        etaText = `已于 ${formatTime(order.completedAt)} 送达`;
    }
    
    // 生成订单追踪HTML
    trackingContent.innerHTML = `
        <div class="tracking-header">
            <div class="order-info">
                <h3>订单 ${order.id}</h3>
                <div class="order-meta">
                    <span class="order-time">${formatDateTime(order.createdAt)}</span>
                    <span class="order-price">¥${order.price.toFixed(2)}</span>
                </div>
            </div>
            <div class="tracking-status ${statusClass}">
                <div class="status-icon"></div>
                <div class="status-text">${statusText}</div>
            </div>
        </div>
        
        <div class="tracking-details">
            <div class="addresses-container">
                <div class="tracking-address pickup">
                    <div class="address-marker"></div>
                    <div class="address-content">
                        <div class="address-label">取货地点</div>
                        <div class="address-text">${order.pickupAddress}</div>
                    </div>
                </div>
                <div class="route-line"></div>
                <div class="tracking-address delivery">
                    <div class="address-marker"></div>
                    <div class="address-content">
                        <div class="address-label">送货地点</div>
                        <div class="address-text">${order.deliveryAddress}</div>
                    </div>
                </div>
            </div>
            
            <div class="eta-container">
                <div class="eta-icon">
                    <i class="fa fa-clock"></i>
                </div>
                <div class="eta-text">${etaText}</div>
            </div>
            
            ${order.assignedVehicle ? `
                <div class="driver-container">
                    <div class="driver-avatar">
                        <img src="../assets/icons/driver-avatar.png" alt="Driver">
                    </div>
                    <div class="driver-info">
                        <div class="driver-name">${order.driverName || '配送员'}</div>
                        <div class="vehicle-info">${order.vehicleType || '配送车辆'} · ${order.assignedVehicle}</div>
                    </div>
                    <button class="contact-driver-btn">
                        <i class="fa fa-phone"></i> 联系司机
                    </button>
                </div>
            ` : ''}
            
            <div class="order-details-container">
                <div class="detail-item">
                    <div class="detail-label">配送距离</div>
                    <div class="detail-value">${order.distance.toFixed(1)} 公里</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">货物类型</div>
                    <div class="detail-value">${getCargoTypeText(order.cargoType)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">重量</div>
                    <div class="detail-value">${order.weight} 公斤</div>
                </div>
                ${order.remarks ? `
                    <div class="detail-item">
                        <div class="detail-label">备注</div>
                        <div class="detail-value">${order.remarks}</div>
                    </div>
                ` : ''}
            </div>
        </div>
        
        ${order.status !== 'completed' ? `
            <div class="tracking-actions">
                <button class="secondary-btn cancel-order-btn">取消订单</button>
                <button class="primary-btn refresh-tracking-btn">刷新状态</button>
            </div>
        ` : `
            <div class="order-completed">
                <div class="completion-message">订单已完成</div>
                <div class="rating-container">
                    <div class="rating-label">为本次服务评分</div>
                    <div class="star-rating">
                        <i class="far fa-star" data-rating="1"></i>
                        <i class="far fa-star" data-rating="2"></i>
                        <i class="far fa-star" data-rating="3"></i>
                        <i class="far fa-star" data-rating="4"></i>
                        <i class="far fa-star" data-rating="5"></i>
                    </div>
                </div>
            </div>
        `}
    `;
    
    // 绑定事件
    if (order.status !== 'completed') {
        // 刷新追踪按钮
        const refreshBtn = trackingContent.querySelector('.refresh-tracking-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                showLoadingSpinner('正在更新订单状态...');
                updateOrderTracking(true);
            });
        }
        
        // 取消订单按钮
        const cancelBtn = trackingContent.querySelector('.cancel-order-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                confirmCancelOrder(order.id);
            });
        }
    } else {
        // 星级评分
        const stars = trackingContent.querySelectorAll('.star-rating i');
        stars.forEach(star => {
            star.addEventListener('mouseover', () => {
                const rating = parseInt(star.getAttribute('data-rating'));
                highlightStars(stars, rating);
            });
            
            star.addEventListener('mouseout', () => {
                // 如果没有选定的评分，清除高亮
                if (!trackingContent.querySelector('.star-rating').getAttribute('data-selected')) {
                    stars.forEach(s => s.className = 'far fa-star');
                } else {
                    // 恢复到选定的评分高亮
                    const selectedRating = parseInt(trackingContent.querySelector('.star-rating').getAttribute('data-selected'));
                    highlightStars(stars, selectedRating);
                }
            });
            
            star.addEventListener('click', () => {
                const rating = parseInt(star.getAttribute('data-rating'));
                // 保存选定的评分
                trackingContent.querySelector('.star-rating').setAttribute('data-selected', rating.toString());
                highlightStars(stars, rating);
                submitRating(order.id, rating);
            });
        });
    }
    
    // 联系司机按钮
    const contactBtn = trackingContent.querySelector('.contact-driver-btn');
    if (contactBtn) {
        contactBtn.addEventListener('click', () => {
            // 模拟联系司机
            showNotification('正在呼叫司机...', 'info');
            setTimeout(() => {
                alert('司机电话: 138-xxxx-xxxx\n(实际应用中会直接拨打或发送消息)');
            }, 500);
        });
    }
}

/**
 * 高亮星级评分
 * @param {NodeList} stars - 星星元素列表
 * @param {number} rating - 评分
 */
function highlightStars(stars, rating) {
    stars.forEach(s => {
        const starRating = parseInt(s.getAttribute('data-rating'));
        if (starRating <= rating) {
            s.className = 'fas fa-star'; // 实心星
        } else {
            s.className = 'far fa-star'; // 空心星
        }
    });
}

/**
 * 提交评分
 * @param {string} orderId - 订单ID
 * @param {number} rating - 评分
 */
function submitRating(orderId, rating) {
    // 在实际应用中，这里会发送API请求
    showLoadingSpinner('正在提交评分...');
    
    setTimeout(() => {
        hideLoadingSpinner();
        showNotification(`感谢您的评价! 您为订单 ${orderId} 评了 ${rating} 星`, 'success');
        
        // 更新订单对象
        const orderIndex = UserState.orderHistory.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            UserState.orderHistory[orderIndex].rating = rating;
        }
    }, 1000);
}

/**
 * 更新订单追踪
 * @param {boolean} showNotifications - 是否显示通知
 */
function updateOrderTracking(showNotifications = false) {
    if (!UserState.trackingOrder) return;
    
    const order = UserState.trackingOrder;
    
    // 在实际应用中，这里会通过API请求获取订单最新状态
    // 这里使用模拟数据更新
    
    // 模拟位置更新
    if (order.trackingInfo) {
        // 根据订单状态更新位置
        if (order.status === 'assigned') {
            // 车辆正在前往取货点，模拟向取货点移动
            moveTowardsLocation(order.trackingInfo.currentLocation, order.pickupPosition, 0.2);
            
            // 检查是否到达取货点
            const distanceToPickup = calculateDistance(
                order.trackingInfo.currentLocation, 
                order.pickupPosition
            );
            
            // 如果距离很近，模拟到达取货点
            if (distanceToPickup < 0.2 && Math.random() > 0.5) {
                // 更新订单状态为配送中
                order.status = 'in-progress';
                order.pickedUpAt = new Date();
                
                if (showNotifications) {
                    showNotification('司机已到达取货点，开始配送', 'success');
                }
            }
        } else if (order.status === 'in-progress') {
            // 车辆正在前往送货点，模拟向送货点移动
            moveTowardsLocation(order.trackingInfo.currentLocation, order.deliveryPosition, 0.3);
            
            // 检查是否到达送货点
            const distanceToDelivery = calculateDistance(
                order.trackingInfo.currentLocation, 
                order.deliveryPosition
            );
            
            // 如果距离很近，模拟订单完成
            if (distanceToDelivery < 0.2 && Math.random() > 0.7) {
                // 更新订单状态为已完成
                order.status = 'completed';
                order.completedAt = new Date();
                
                if (showNotifications) {
                    showNotification('订单已送达目的地，配送完成！', 'success');
                }
            }
        }
        
        // 更新位置时间
        order.trackingInfo.updatedAt = new Date();
    }
    
    // 如果显式要求显示通知，则显示当前状态
    if (showNotifications) {
        hideLoadingSpinner();
        
        if (order.status === 'pending') {
            showNotification('等待分配车辆...', 'info');
        } else if (order.status === 'assigned') {
            showNotification('司机正在前往取货点', 'info');
        } else if (order.status === 'in-progress') {
            showNotification('货物正在配送中', 'info');
        }
    }
    
    // 更新追踪视图
    updateTrackingView();
    
    // 更新地图
    updateMapForCurrentView();
}

/**
 * 坐标点向目标位置移动
 * @param {Array} current - 当前位置 [经度, 纬度]
 * @param {Array} target - 目标位置 [经度, 纬度]
 * @param {number} factor - 移动因子(0-1)
 */
function moveTowardsLocation(current, target, factor) {
    if (!current || !target || !Array.isArray(current) || !Array.isArray(target)) return;
    
    // 计算方向向量
    const dx = target[0] - current[0];
    const dy = target[1] - current[1];
    
    // 添加一些随机偏移，模拟真实路线
    const randomOffsetX = (Math.random() * 0.002 - 0.001);
    const randomOffsetY = (Math.random() * 0.002 - 0.001);
    
    // 更新位置
    current[0] += dx * factor + randomOffsetX;
    current[1] += dy * factor + randomOffsetY;
}

/**
 * 计算两个位置之间的距离
 * @param {Array} pos1 - 位置1 [经度, 纬度]
 * @param {Array} pos2 - 位置2 [经度, 纬度]
 * @returns {number} 距离(公里)
 */
function calculateDistance(pos1, pos2) {
    if (!pos1 || !pos2 || !Array.isArray(pos1) || !Array.isArray(pos2)) return 0;
    
    // 使用简化版的球面距离计算公式
    const R = 6371; // 地球半径，单位公里
    const dLat = (pos2[1] - pos1[1]) * Math.PI / 180;
    const dLon = (pos2[0] - pos1[0]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1[1] * Math.PI / 180) * Math.cos(pos2[1] * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * 确认取消订单
 * @param {string} orderId - 订单ID
 */
function confirmCancelOrder(orderId) {
    // 创建确认对话框
    const modalContent = `
        <div class="modal-header">
            <h3>取消订单</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <p>您确定要取消订单 ${orderId} 吗？</p>
            <div class="alert alert-warning">
                <i class="fa fa-exclamation-triangle"></i>
                <span>取消订单可能会产生费用，具体以平台规则为准。</span>
            </div>
        </div>
        <div class="modal-footer">
            <button class="secondary-btn" id="cancel-no-btn">返回</button>
            <button class="primary-btn danger" id="cancel-yes-btn">确认取消</button>
        </div>
    `;
    
    // 显示模态框
    const modal = showModal(modalContent, 'cancel-order-modal');
    
    // 绑定按钮事件
    const cancelNoBtn = modal.querySelector('#cancel-no-btn');
    const cancelYesBtn = modal.querySelector('#cancel-yes-btn');
    
    if (cancelNoBtn) {
        cancelNoBtn.addEventListener('click', () => {
            closeModal();
        });
    }
    
    if (cancelYesBtn) {
        cancelYesBtn.addEventListener('click', () => {
            closeModal();
            cancelOrder(orderId);
        });
    }
}

/**
 * 取消订单
 * @param {string} orderId - 订单ID
 */
function cancelOrder(orderId) {
    showLoadingSpinner('正在取消订单...');
    
    // 在实际应用中，这里会发送API请求
    setTimeout(() => {
        hideLoadingSpinner();
        
        // 查找并更新订单状态
        const orderIndex = UserState.orderHistory.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            UserState.orderHistory[orderIndex].status = 'cancelled';
            UserState.orderHistory[orderIndex].cancelledAt = new Date();
        }
        
        // 如果取消的是当前追踪的订单，清除追踪状态
        if (UserState.trackingOrder && UserState.trackingOrder.id === orderId) {
            UserState.trackingOrder = null;
        }
        
        // 清除追踪定时器
        if (window.trackingInterval) {
            clearInterval(window.trackingInterval);
            window.trackingInterval = null;
        }
        
        // 显示通知
        showNotification('订单已成功取消', 'success');
        
        // 更新视图
        if (UserState.currentView === 'tracking') {
            initTrackingView();
        }
    }, 1500);
}

/**
 * 显示历史订单列表
 */
function displayOrderHistory() {
    const historyContent = document.getElementById('history-content');
    if (!historyContent) return;
    
    // 如果没有历史订单，显示空状态
    if (!UserState.orderHistory || UserState.orderHistory.length === 0) {
        historyContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fa fa-history"></i>
                </div>
                <h3>没有历史订单</h3>
                <p>您还没有创建过订单</p>
                <button id="create-first-order-btn" class="primary-btn">创建第一个订单</button>
            </div>
        `;
        
        // 绑定创建订单按钮
        const createFirstOrderBtn = document.getElementById('create-first-order-btn');
        if (createFirstOrderBtn) {
            createFirstOrderBtn.addEventListener('click', () => {
                switchView('order');
                
                // 更新导航菜单高亮
                document.querySelectorAll('.nav-item').forEach(item => {
                    const view = item.getAttribute('data-view');
                    item.classList.toggle('active', view === 'order');
                });
            });
        }
        
        return;
    }
    
    // 创建订单筛选和排序控件
    const filterControls = `
        <div class="history-controls">
            <div class="history-filter">
                <select id="history-filter-select">
                    <option value="all">全部订单</option>
                    <option value="completed">已完成</option>
                    <option value="in-progress">进行中</option>
                    <option value="cancelled">已取消</option>
                </select>
            </div>
            <div class="history-sort">
                <select id="history-sort-select">
                    <option value="newest">最新订单优先</option>
                    <option value="oldest">最早订单优先</option>
                    <option value="price-high">金额从高到低</option>
                    <option value="price-low">金额从低到高</option>
                </select>
            </div>
        </div>
    `;
    
    // 创建订单列表
    const ordersHTML = UserState.orderHistory.map(order => {
        // 确定订单状态样式
        let statusClass = 'status-pending';
        let statusText = '等待接单';
        
        switch (order.status) {
            case 'assigned':
                statusClass = 'status-assigned';
                statusText = '待取货';
                break;
            case 'in-progress':
                statusClass = 'status-in-progress';
                statusText = '配送中';
                break;
            case 'completed':
                statusClass = 'status-completed';
                statusText = '已完成';
                break;
            case 'cancelled':
                statusClass = 'status-cancelled';
                statusText = '已取消';
                break;
        }
        
        // 确定操作按钮
        let actionBtn = '';
        if (order.status === 'completed') {
            // 已完成订单可以查看详情
            actionBtn = `<button class="view-order-btn" data-order-id="${order.id}">查看详情</button>`;
        } else if (order.status === 'in-progress' || order.status === 'assigned') {
            // 进行中订单可以追踪
            actionBtn = `<button class="track-order-btn" data-order-id="${order.id}">追踪订单</button>`;
        } else if (order.status === 'pending') {
            // 等待中订单可以取消
            actionBtn = `<button class="cancel-order-btn" data-order-id="${order.id}">取消订单</button>`;
        } else {
            // 其他状态也可以查看详情
            actionBtn = `<button class="view-order-btn" data-order-id="${order.id}">查看详情</button>`;
        }
        
        // 返回订单项HTML
        return `
            <div class="order-history-item" data-order-id="${order.id}" data-status="${order.status}">
                <div class="order-header">
                    <div class="order-id">订单 ${order.id}</div>
                    <div class="order-status ${statusClass}">${statusText}</div>
                </div>
                <div class="order-details">
                    <div class="order-addresses">
                        <div class="pickup-address">
                            <div class="address-label">取</div>
                            <div class="address-text">${order.pickupAddress}</div>
                        </div>
                        <div class="delivery-address">
                            <div class="address-label">送</div>
                            <div class="address-text">${order.deliveryAddress}</div>
                        </div>
                    </div>
                    <div class="order-meta">
                        <div class="order-time">${formatDateTime(order.createdAt)}</div>
                        <div class="order-price">¥${order.price.toFixed(2)}</div>
                        <div class="order-cargo">${getCargoTypeText(order.cargoType)}</div>
                    </div>
                </div>
                <div class="order-actions">
                    ${actionBtn}
                </div>
            </div>
        `;
    }).join('');
    
    // 合并控件和列表
    historyContent.innerHTML = `
        ${filterControls}
        <div class="order-history-list">
            ${ordersHTML}
        </div>
    `;
    
    // 绑定筛选和排序事件
    const filterSelect = document.getElementById('history-filter-select');
    const sortSelect = document.getElementById('history-sort-select');
    
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            filterHistoryOrders(filterSelect.value, sortSelect ? sortSelect.value : 'newest');
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            filterHistoryOrders(filterSelect ? filterSelect.value : 'all', sortSelect.value);
        });
    }
}

/**
 * 筛选历史订单
 * @param {string} filterType - 筛选类型
 * @param {string} sortType - 排序类型
 */
function filterHistoryOrders(filterType = 'all', sortType = 'newest') {
    // 获取所有订单项
    const orderItems = document.querySelectorAll('.order-history-item');
    
    // 应用筛选
    orderItems.forEach(item => {
        const status = item.getAttribute('data-status');
        
        if (filterType === 'all' || status === filterType) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
    
    // 应用排序 (这里仅为演示，实际应用中可能需要重新加载数据或操作DOM)
    // 实现排序逻辑需要更复杂的DOM操作，这里仅作为示例
    const ordersContainer = document.querySelector('.order-history-list');
    if (ordersContainer) {
        // 示例：如果需要完整实现排序，可以重新查询并排序UserState.orderHistory，然后重新渲染
        // 这里简化处理，只显示一个通知
        showNotification(`已按"${sortText(sortType)}"排序`, 'info', 1000);
    }
}

/**
 * 获取排序类型的文本描述
 * @param {string} sortType - 排序类型
 * @returns {string} 排序描述
 */
function sortText(sortType) {
    switch (sortType) {
        case 'newest': return '最新订单优先';
        case 'oldest': return '最早订单优先';
        case 'price-high': return '金额从高到低';
        case 'price-low': return '金额从低到低';
        default: return '默认排序';
    }
}

/**
 * 查看订单详情
 * @param {string} orderId - 订单ID
 */
function viewOrderDetails(orderId) {
    // 查找订单
    const order = UserState.orderHistory.find(o => o.id === orderId);
    if (!order) {
        showNotification('找不到订单信息', 'error');
        return;
    }
    
    // 确定订单状态文本
    let statusText = '等待接单';
    let statusClass = 'status-pending';
    
    switch (order.status) {
        case 'assigned':
            statusText = '待取货';
            statusClass = 'status-assigned';
            break;
        case 'in-progress':
            statusText = '配送中';
            statusClass = 'status-in-progress';
            break;
        case 'completed':
            statusText = '已完成';
            statusClass = 'status-completed';
            break;
        case 'cancelled':
            statusText = '已取消';
            statusClass = 'status-cancelled';
            break;
    }
    
    // 创建订单详情模态框内容
    const modalContent = `
        <div class="modal-header">
            <h3>订单详情</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <div class="order-detail-header">
                <div class="order-id-large">订单号: ${order.id}</div>
                <div class="order-status-badge ${statusClass}">${statusText}</div>
            </div>
            
            <div class="detail-section addresses-section">
                <div class="section-title">配送信息</div>
                <div class="address-detail pickup">
                    <div class="address-icon pickup-icon"></div>
                    <div class="address-content">
                        <div class="address-label">取货点</div>
                        <div class="address-text">${order.pickupAddress}</div>
                    </div>
                </div>
                <div class="address-detail delivery">
                    <div class="address-icon delivery-icon"></div>
                    <div class="address-content">
                        <div class="address-label">送货点</div>
                        <div class="address-text">${order.deliveryAddress}</div>
                    </div>
                </div>
            </div>
            
            <div class="detail-section cargo-section">
                <div class="section-title">货物信息</div>
                <div class="detail-row">
                    <div class="detail-label">类型</div>
                    <div class="detail-value">${getCargoTypeText(order.cargoType)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">重量</div>
                    <div class="detail-value">${order.weight} 公斤</div>
                </div>
                ${order.urgent ? `
                <div class="detail-row">
                    <div class="detail-label">加急</div>
                    <div class="detail-value highlight">是</div>
                </div>
                ` : ''}
                ${order.remarks ? `
                <div class="detail-row">
                    <div class="detail-label">备注</div>
                    <div class="detail-value">${order.remarks}</div>
                </div>
                ` : ''}
            </div>
            
            <div class="detail-section status-section">
                <div class="section-title">订单状态</div>
                <div class="timeline">
                    <div class="timeline-item active">
                        <div class="timeline-icon"><i class="fa fa-check-circle"></i></div>
                        <div class="timeline-content">
                            <div class="timeline-title">订单创建</div>
                            <div class="timeline-time">${formatDateTime(order.createdAt)}</div>
                        </div>
                    </div>
                    
                    ${order.assignedAt ? `
                    <div class="timeline-item active">
                        <div class="timeline-icon"><i class="fa fa-check-circle"></i></div>
                        <div class="timeline-content">
                            <div class="timeline-title">司机接单</div>
                            <div class="timeline-time">${formatDateTime(order.assignedAt)}</div>
                            <div class="timeline-detail">司机: ${order.driverName || '未知'} (${order.assignedVehicle || '未分配'})</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${order.pickedUpAt ? `
                    <div class="timeline-item active">
                        <div class="timeline-icon"><i class="fa fa-check-circle"></i></div>
                        <div class="timeline-content">
                            <div class="timeline-title">已取货</div>
                            <div class="timeline-time">${formatDateTime(order.pickedUpAt)}</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${order.completedAt ? `
                    <div class="timeline-item active">
                        <div class="timeline-icon"><i class="fa fa-check-circle"></i></div>
                        <div class="timeline-content">
                            <div class="timeline-title">已送达</div>
                            <div class="timeline-time">${formatDateTime(order.completedAt)}</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${order.cancelledAt ? `
                    <div class="timeline-item cancelled">
                        <div class="timeline-icon"><i class="fa fa-times-circle"></i></div>
                        <div class="timeline-content">
                            <div class="timeline-title">订单取消</div>
                            <div class="timeline-time">${formatDateTime(order.cancelledAt)}</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="detail-section payment-section">
                <div class="section-title">费用明细</div>
                <table class="payment-table">
                    <tr>
                        <td>基础配送费</td>
                        <td class="price">¥${order.basePrice ? order.basePrice.toFixed(2) : '15.00'}</td>
                    </tr>
                    <tr>
                        <td>距离费 (${order.distance ? order.distance.toFixed(1) : '0'} 公里)</td>
                        <td class="price">¥${order.distancePrice ? order.distancePrice.toFixed(2) : '0.00'}</td>
                    </tr>
                    ${order.cargoPrice && order.cargoPrice > 0 ? `
                    <tr>
                        <td>货物附加费</td>
                        <td class="price">¥${order.cargoPrice.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    ${order.urgentPrice && order.urgentPrice > 0 ? `
                    <tr>
                        <td>加急服务费</td>
                        <td class="price">¥${order.urgentPrice.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    <tr class="total-row">
                        <td>总计</td>
                        <td class="price total">¥${order.price.toFixed(2)}</td>
                    </tr>
                </table>
            </div>
            
            ${order.rating ? `
            <div class="detail-section rating-section">
                <div class="section-title">您的评价</div>
                <div class="rating-display">
                    ${generateStarRating(order.rating)}
                </div>
            </div>
            ` : ''}
        </div>
        <div class="modal-footer">
            ${order.status === 'in-progress' || order.status === 'assigned' ? `
                <button class="primary-btn" id="track-this-order-btn">追踪此订单</button>
            ` : ''}
            <button class="secondary-btn" id="close-details-btn">关闭</button>
        </div>
    `;
    
    // 显示模态框
    const modal = showModal(modalContent, 'order-details-modal');
    
    // 绑定按钮事件
    const closeDetailsBtn = modal.querySelector('#close-details-btn');
    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', closeModal);
    }
    
    const trackThisOrderBtn = modal.querySelector('#track-this-order-btn');
    if (trackThisOrderBtn) {
        trackThisOrderBtn.addEventListener('click', () => {
            closeModal();
            trackOrder(order.id);
        });
    }
}

/**
 * 生成星级评分HTML
 * @param {number} rating - 评分(1-5)
 * @returns {string} 星级评分HTML
 */
function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>'; // 实心星
        } else {
            stars += '<i class="far fa-star"></i>'; // 空心星
        }
    }
    return stars;
}

/**
 * 追踪指定订单
 * @param {string} orderId - 订单ID
 */
function trackOrder(orderId) {
    // 查找订单
    const order = UserState.orderHistory.find(o => o.id === orderId);
    if (!order) {
        showNotification('找不到订单信息', 'error');
        return;
    }
    
    // 检查订单状态
    if (order.status !== 'in-progress' && order.status !== 'assigned' && order.status !== 'pending') {
        showNotification('此订单已完成或已取消，无法追踪', 'warning');
        return;
    }
    
    // 设置为当前追踪订单
    UserState.trackingOrder = order;
    
    // 切换到追踪视图
    switchView('tracking');
    
    // 更新导航菜单高亮
    document.querySelectorAll('.nav-item').forEach(item => {
        const view = item.getAttribute('data-view');
        item.classList.toggle('active', view === 'tracking');
    });
}

/**
 * 获取货物类型文本
 * @param {string} cargoType - 货物类型代码
 * @returns {string} 货物类型文本
 */
function getCargoTypeText(cargoType) {
    switch (cargoType) {
        case 'small': return '小件';
        case 'medium': return '中件';
        case 'large': return '大件';
        default: return '未知';
    }
}

/**
 * 格式化时间
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的时间
 */
function formatTime(date) {
    if (!date) return '';
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
}

/**
 * 格式化日期时间
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期时间
 */
function formatDateTime(date) {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 显示模态框
 * @param {string} content - 模态框内容
 * @param {string} modalClass - 模态框CSS类
 * @returns {HTMLElement} 模态框元素
 */
function showModal(content, modalClass = '') {
    // 创建模态框容器
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    // 创建模态框
    const modalElement = document.createElement('div');
    modalElement.className = 'modal ' + modalClass;
    modalElement.innerHTML = content;
    
    // 添加到容器
    modalContainer.appendChild(modalElement);
    
    // 添加到文档
    document.body.appendChild(modalContainer);
    
    // 添加动画类
    setTimeout(() => {
        modalContainer.classList.add('show');
    }, 10);
    
    // 绑定关闭按钮事件
    const closeBtn = modalElement.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // 点击背景关闭
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            closeModal();
        }
    });
    
    return modalElement;
}

/**
 * 关闭模态框
 */
function closeModal() {
    const modalContainer = document.querySelector('.modal-container');
    if (modalContainer) {
        modalContainer.classList.remove('show');
        
        // 动画结束后移除模态框
        setTimeout(() => {
            modalContainer.remove();
        }, 300);
    }
}

/**
 * 显示加载动画
 * @param {string} message - 加载提示信息
 */
function showLoadingSpinner(message = '加载中...') {
    // 检查是否已有加载动画
    let spinner = document.querySelector('.loading-spinner');
    
    if (!spinner) {
        // 创建加载动画
        spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = `
            <div class="spinner-content">
                <div class="spinner"></div>
                <div class="spinner-message">${message}</div>
            </div>
        `;
        
        // 添加到文档
        document.body.appendChild(spinner);
        
        // 添加动画类
        setTimeout(() => {
            spinner.classList.add('show');
        }, 10);
    } else {
        // 更新加载信息
        const messageEl = spinner.querySelector('.spinner-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
    }
}

/**
 * 隐藏加载动画
 */
function hideLoadingSpinner() {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
        spinner.classList.remove('show');
        
        // 动画结束后移除
        setTimeout(() => {
            spinner.remove();
        }, 300);
    }
}

/**
 * 显示通知消息
 * @param {string} message - 通知内容
 * @param {string} type - 通知类型 'success', 'error', 'warning', 'info'
 * @param {number} duration - 显示时长(ms)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // 设置图标
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'times-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    // 设置通知内容
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fa fa-${icon}"></i>
        </div>
        <div class="notification-message">${message}</div>
        <button class="notification-close">
            <i class="fa fa-times"></i>
        </button>
    `;
    
    // 获取或创建通知容器
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // 添加通知到容器
    notificationContainer.appendChild(notification);
    
    // 添加动画类
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 绑定关闭按钮
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeNotification(notification);
        });
    }
    
    // 自动关闭
    if (duration > 0) {
        setTimeout(() => {
            closeNotification(notification);
        }, duration);
    }
    
    return notification;
}

/**
 * 关闭通知消息
 * @param {HTMLElement} notification - 通知元素
 */
function closeNotification(notification) {
    notification.classList.remove('show');
    
    // 动画结束后移除
    setTimeout(() => {
        notification.remove();
        
        // 如果通知容器为空，移除容器
        const notificationContainer = document.querySelector('.notification-container');
        if (notificationContainer && !notificationContainer.hasChildNodes()) {
            notificationContainer.remove();
        }
    }, 300);
}

/**
 * 初始化用户界面
 */
function initUserInterface() {
    // 初始化用户状态
    initUserState();
    
    // 初始化视图
    initViews();
    
    // 设置导航事件
    setupNavigation();
    
    // 初始化地图
    initMap();
    
    // 设置表单事件
    setupFormEvents();
    
    // 更新用户信息显示
    updateUserInfoDisplay();
    
    // 默认切换到下单视图
    switchView(UserState.currentView || 'order');
    
    // 高亮当前视图对应的导航项
    document.querySelectorAll('.nav-item').forEach(item => {
        const view = item.getAttribute('data-view');
        item.classList.toggle('active', view === UserState.currentView);
    });
}

// 当页面加载完成时初始化用户界面
document.addEventListener('DOMContentLoaded', initUserInterface);
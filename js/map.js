/**
 * 智送城市货运智能调度系统 - 地图功能模块
 * 负责地图初始化、路线规划、标记点管理等
 */

// 地图实例存储对象
window.mapInstances = {};

// 地图样式配置
const MAP_STYLES = {
    // 普通地图样式
    normal: 'amap://styles/normal',
    // 黑夜模式
    dark: 'amap://styles/dark',
    // 卫星图
    satellite: 'amap://styles/satellite'
};

// 地图标记物存储
const mapMarkers = {
    vehicles: {}, // 车辆标记
    orders: {},   // 订单标记
    routes: {}    // 路线标记
};

// 地图热力数据
let heatmapData = [];

/**
 * 初始化所有地图
 */
function initializeMaps() {
    // 初始化用户端地图
    initUserMap();
    
    // 初始化司机端地图
    initDriverMap();
    
    // 初始化管理端地图
    initAdminMap();
    
    console.log('所有地图初始化完成');
}

/**
 * 初始化用户端地图
 */
function initUserMap() {
    // 用户端地图容器
    const userMapContainer = document.getElementById('user-map');
    
    if (!userMapContainer) return;
    
    // 创建地图实例
    const userMap = new AMap.Map('user-map', {
        viewMode: '2D',
        zoom: 12,
        center: CONFIG.DEFAULT_CENTER,
        mapStyle: MAP_STYLES.normal
    });
    
    // 添加控制组件
    addMapControls(userMap);
    
    // 存储地图实例
    window.mapInstances['user-map'] = userMap;
    
    // 监听地图点击事件（用于选择地址）
    userMap.on('click', (e) => {
        const { lng, lat } = e.lnglat;
        handleMapClick(lng, lat, 'user');
    });
    
    // 模拟加载演示数据
    setTimeout(() => {
        loadUserMapDemoData(userMap);
    }, CONFIG.DEMO_DELAY);
}

/**
 * 初始化司机端地图
 */
function initDriverMap() {
    // 司机端地图容器
    const driverMapContainer = document.getElementById('driver-map');
    
    if (!driverMapContainer) return;
    
    // 创建地图实例
    const driverMap = new AMap.Map('driver-map', {
        viewMode: '2D',
        zoom: 14,
        center: CONFIG.DEFAULT_CENTER,
        mapStyle: MAP_STYLES.normal
    });
    
    // 添加控制组件
    addMapControls(driverMap, {
        isDriverMap: true
    });
    
    // 添加定位插件
    driverMap.plugin('AMap.Geolocation', () => {
        const geolocation = new AMap.Geolocation({
            enableHighAccuracy: true,
            timeout: 10000,
            buttonPosition: 'RB',
            buttonOffset: new AMap.Pixel(10, 20),
            zoomToAccuracy: true
        });
        
        driverMap.addControl(geolocation);
        
        // 获取当前位置
        geolocation.getCurrentPosition((status, result) => {
            if (status === 'complete') {
                const { position } = result;
                driverMap.setCenter(position);
                
                // 添加当前位置标记
                addVehicleMarker(driverMap, {
                    id: 'current-vehicle',
                    position: position,
                    status: 'available',
                    isCurrent: true
                });
            }
        });
    });
    
    // 存储地图实例
    window.mapInstances['driver-map'] = driverMap;
    
    // 模拟加载演示数据
    setTimeout(() => {
        loadDriverMapDemoData(driverMap);
    }, CONFIG.DEMO_DELAY);
}

/**
 * 初始化管理端地图
 */
function initAdminMap() {
    // 管理端地图容器
    const adminMapContainer = document.getElementById('admin-map');
    
    if (!adminMapContainer) return;
    
    // 创建地图实例
    const adminMap = new AMap.Map('admin-map', {
        viewMode: '2D',
        zoom: 11,
        center: CONFIG.DEFAULT_CENTER,
        mapStyle: MAP_STYLES.normal
    });
    
    // 添加控制组件
    addMapControls(adminMap, {
        isAdminMap: true
    });
    
    // 存储地图实例
    window.mapInstances['admin-map'] = adminMap;
    
    // 模拟加载演示数据
    setTimeout(() => {
        loadAdminMapDemoData(adminMap);
    }, CONFIG.DEMO_DELAY);
}

/**
 * 添加地图控制组件
 * @param {AMap.Map} map - 地图实例
 * @param {Object} options - 配置选项
 */
function addMapControls(map, options = {}) {
    // 添加比例尺控件
    map.addControl(new AMap.Scale());
    
    // 添加缩放控件
    map.addControl(new AMap.ToolBar({
        position: 'RB'
    }));
    
    // 实时路况图层(仅司机和管理端地图)
    if (options.isDriverMap || options.isAdminMap) {
        // 添加实时路况图层
        const trafficLayer = new AMap.TileLayer.Traffic({
            zIndex: 10
        });
        map.add(trafficLayer);
        
        // 创建图层切换控件
        const layerCtrl = document.createElement('div');
        layerCtrl.className = 'layer-control';
        layerCtrl.innerHTML = `
            <div class="layer-btn traffic-btn active" title="路况">
                <i class="fa fa-road"></i>
            </div>
        `;
        
        // 添加到地图
        map.getContainer().appendChild(layerCtrl);
        
        // 绑定事件
        layerCtrl.querySelector('.traffic-btn').addEventListener('click', (e) => {
            const isActive = e.target.closest('.traffic-btn').classList.toggle('active');
            if (isActive) {
                trafficLayer.show();
            } else {
                trafficLayer.hide();
            }
        });
    }
    
    // 管理端特有控件
    if (options.isAdminMap) {
        // 添加热力图切换控件
        const heatmapCtrl = document.createElement('div');
        heatmapCtrl.className = 'layer-control heatmap-control';
        heatmapCtrl.innerHTML = `
            <div class="layer-btn heatmap-btn" title="热力图">
                <i class="fa fa-fire"></i>
            </div>
        `;
        
        // 添加到地图
        map.getContainer().appendChild(heatmapCtrl);
        
        // 热力图实例
        let heatmap = null;
        
        // 绑定事件
        heatmapCtrl.querySelector('.heatmap-btn').addEventListener('click', (e) => {
            const isActive = e.target.closest('.heatmap-btn').classList.toggle('active');
            
            if (isActive) {
                // 创建热力图
                if (!heatmap) {
                    // 获取或生成热力图数据
                    const heatmapData = generateHeatmapData();
                    
                    heatmap = new AMap.HeatMap(map, {
                        radius: 25,
                        opacity: [0, 0.8],
                        gradient: {
                            0.4: 'rgb(0, 255, 255)',
                            0.65: 'rgb(0, 255, 0)',
                            0.85: 'rgb(255, 255, 0)',
                            1.0: 'rgb(255, 0, 0)'
                        }
                    });
                    
                    heatmap.setDataSet({
                        data: heatmapData,
                        max: 100
                    });
                }
                heatmap.show();
            } else if (heatmap) {
                heatmap.hide();
            }
        });
    }
}

/**
 * 处理地图点击事件
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @param {string} mapType - 地图类型 ('user', 'driver', 'admin')
 */
function handleMapClick(lng, lat, mapType) {
    // 根据地图类型处理不同逻辑
    if (mapType === 'user') {
        // 逆地理编码，获取地址信息
        const geocoder = new AMap.Geocoder();
        geocoder.getAddress([lng, lat], (status, result) => {
            if (status === 'complete' && result.info === 'OK') {
                const address = result.regeocode.formattedAddress;
                
                // 判断当前焦点是哪个输入框
                const activeInput = document.activeElement;
                if (activeInput && (activeInput.id === 'pickup-address' || activeInput.id === 'delivery-address')) {
                    activeInput.value = address;
                    // 触发输入事件以便更新相关数据
                    const event = new Event('input', { bubbles: true });
                    activeInput.dispatchEvent(event);
                }
            }
        });
    }
}

/**
 * 加载用户端地图演示数据
 * @param {AMap.Map} map - 地图实例
 */
function loadUserMapDemoData(map) {
    // 清除现有标记
    clearMapMarkers('user');
    
    // 添加可用车辆标记
    const vehicles = generateMockVehicles(8);
    vehicles.forEach(vehicle => {
        addVehicleMarker(map, vehicle);
    });
}

/**
 * 加载司机端地图演示数据
 * @param {AMap.Map} map - 地图实例
 */
function loadDriverMapDemoData(map) {
    // 清除现有标记
    clearMapMarkers('driver');
    
    // 添加订单取送点标记
    const mockOrders = [
        {
            id: 'order-1',
            pickupPosition: [CONFIG.DEFAULT_CENTER[0] - 0.02, CONFIG.DEFAULT_CENTER[1] + 0.01],
            pickupAddress: '中央仓库',
            deliveryPosition: [CONFIG.DEFAULT_CENTER[0] + 0.03, CONFIG.DEFAULT_CENTER[1] - 0.02],
            deliveryAddress: '科技园区'
        },
        {
            id: 'order-2',
            pickupPosition: [CONFIG.DEFAULT_CENTER[0] - 0.01, CONFIG.DEFAULT_CENTER[1] - 0.03],
            pickupAddress: '南站物流中心',
            deliveryPosition: [CONFIG.DEFAULT_CENTER[0] + 0.02, CONFIG.DEFAULT_CENTER[1] - 0.04],
            deliveryAddress: '大学城'
        }
    ];
    
    mockOrders.forEach(order => {
        // 添加取货点标记
        addOrderMarker(map, {
            id: `${order.id}-pickup`,
            position: order.pickupPosition,
            title: `取: ${order.pickupAddress}`,
            type: 'pickup'
        });
        
        // 添加送货点标记
        addOrderMarker(map, {
            id: `${order.id}-delivery`,
            position: order.deliveryPosition,
            title: `送: ${order.deliveryAddress}`,
            type: 'delivery'
        });
        
        // 添加路线
        drawRoute(map, {
            id: order.id,
            origin: order.pickupPosition,
            destination: order.deliveryPosition,
            type: 'driving'
        });
    });
}

/**
 * 加载管理端地图演示数据
 * @param {AMap.Map} map - 地图实例
 */
function loadAdminMapDemoData(map) {
    // 清除现有标记
    clearMapMarkers('admin');
    
    // 添加所有车辆标记
    const vehicles = generateMockVehicles(20);
    vehicles.forEach(vehicle => {
        addVehicleMarker(map, vehicle);
    });
    
    // 添加所有订单标记
    const orders = generateMockOrders(15);
    orders.forEach(order => {
        // 添加取货点标记
        addOrderMarker(map, {
            id: `${order.id}-pickup`,
            position: order.pickupPosition,
            title: `取: ${order.orderId}`,
            type: 'pickup',
            size: 'small'
        });
        
        // 添加送货点标记
        addOrderMarker(map, {
            id: `${order.id}-delivery`,
            position: order.deliveryPosition,
            title: `送: ${order.orderId}`,
            type: 'delivery',
            size: 'small'
        });
    });
    
    // 生成热力图数据
    heatmapData = generateHeatmapData();
}

/**
 * 添加车辆标记
 * @param {AMap.Map} map - 地图实例
 * @param {Object} vehicle - 车辆信息
 */
function addVehicleMarker(map, vehicle) {
    // 获取车辆图标
    let iconUrl = 'assets/icons/vehicle-available.png';
    
    if (vehicle.status === 'busy') {
        iconUrl = 'assets/icons/vehicle-busy.png';
    } else if (vehicle.status === 'offline') {
        iconUrl = 'assets/icons/vehicle-offline.png';
    }
    
    // 创建标记
    const marker = new AMap.Marker({
        map: map,
        position: vehicle.position,
        icon: new AMap.Icon({
            size: new AMap.Size(32, 32),
            image: iconUrl,
            imageSize: new AMap.Size(32, 32)
        }),
        offset: new AMap.Pixel(-16, -16),
        title: vehicle.isCurrent ? '我的位置' : `车辆 ${vehicle.id}`,
        zIndex: vehicle.isCurrent ? 110 : 100,
        angle: vehicle.angle || 0
    });
    
    // 添加点击事件
    marker.on('click', () => {
        showVehicleInfo(map, vehicle, marker);
    });
    
    // 保存标记引用
    mapMarkers.vehicles[vehicle.id] = marker;
    
    return marker;
}

/**
 * 添加订单标记
 * @param {AMap.Map} map - 地图实例
 * @param {Object} order - 订单信息
 */
function addOrderMarker(map, order) {
    // 获取图标
    let iconUrl = 'assets/icons/pickup-point.png';
    let zIndex = 90;
    
    if (order.type === 'delivery') {
        iconUrl = 'assets/icons/delivery-point.png';
        zIndex = 80;
    }
    
    // 图标大小
    const size = order.size === 'small' ? 24 : 32;
    const offset = order.size === 'small' ? -12 : -16;
    
    // 创建标记
    const marker = new AMap.Marker({
        map: map,
        position: order.position,
        icon: new AMap.Icon({
            size: new AMap.Size(size, size),
            image: iconUrl,
            imageSize: new AMap.Size(size, size)
        }),
        offset: new AMap.Pixel(offset, offset),
        title: order.title,
        zIndex: zIndex
    });
    
    // 添加点击事件
    marker.on('click', () => {
        showOrderInfo(map, order, marker);
    });
    
    // 保存标记引用
    mapMarkers.orders[order.id] = marker;
    
    return marker;
}

/**
 * 绘制路线
 * @param {AMap.Map} map - 地图实例
 * @param {Object} routeInfo - 路线信息
 */
function drawRoute(map, routeInfo) {
    // 清除已有的同ID路线
    if (mapMarkers.routes[routeInfo.id]) {
        map.remove(mapMarkers.routes[routeInfo.id]);
    }
    
    // 获取路线规划服务
    const driving = new AMap.Driving({
        map: map,
        panel: routeInfo.panel || null,
        hideMarkers: true
    });
    
    // 规划路线
    driving.search(
        routeInfo.origin,
        routeInfo.destination,
        { waypoints: routeInfo.waypoints || [] },
        (status, result) => {
            if (status === 'complete') {
                // 存储路线对象
                if (result.routes && result.routes.length > 0) {
                    const route = result.routes[0];
                    
                    // 自定义路线样式
                    const path = parseRouteToPath(route);
                    
                    // 创建折线
                    const polyline = new AMap.Polyline({
                        path: path,
                        isOutline: true,
                        outlineColor: '#ffeeee',
                        borderWeight: 2,
                        strokeWeight: 5,
                        strokeColor: '#0091ff',
                        strokeOpacity: 0.7,
                        zIndex: 50,
                        showDir: true
                    });
                    
                    // 添加到地图
                    map.add(polyline);
                    
                    // 存储引用
                    mapMarkers.routes[routeInfo.id] = polyline;
                    
                    // 计算路线信息
                    const distance = route.distance;
                    const duration = route.time;
                    
                    // 触发路线计算完成事件
                    triggerRouteCalculated(routeInfo.id, {
                        distance,
                        duration,
                        path
                    });
                }
            } else {
                console.error('路线规划失败', result);
            }
        }
    );
}

/**
 * 解析路线为路径点数组
 * @param {Object} route - 路线对象
 * @returns {Array} 路径点数组
 */
function parseRouteToPath(route) {
    const path = [];
    if (route && route.steps) {
        route.steps.forEach(step => {
            if (step && step.path) {
                path.push(...step.path);
            }
        });
    }
    return path;
}

/**
 * 触发路线计算完成事件
 * @param {string} routeId - 路线ID
 * @param {Object} routeData - 路线数据
 */
function triggerRouteCalculated(routeId, routeData) {
    // 创建自定义事件
    const event = new CustomEvent('routeCalculated', {
        detail: {
            routeId,
            ...routeData
        }
    });
    
    // 触发事件
    document.dispatchEvent(event);
}

/**
 * 显示车辆信息
 * @param {AMap.Map} map - 地图实例
 * @param {Object} vehicle - 车辆信息
 * @param {AMap.Marker} marker - 车辆标记
 */
function showVehicleInfo(map, vehicle, marker) {
    // 创建信息窗体
    const infoWindow = new AMap.InfoWindow({
        content: `
            <div class="info-window vehicle-info">
                <h3>车辆信息</h3>
                <p>车辆ID: ${vehicle.id}</p>
                <p>状态: ${getVehicleStatusText(vehicle.status)}</p>
                ${vehicle.driver ? `<p>司机: ${vehicle.driver}</p>` : ''}
                ${vehicle.capacity ? `<p>载重: ${vehicle.capacity}m³</p>` : ''}
            </div>
        `,
        offset: new AMap.Pixel(0, -32)
    });
    
    // 打开信息窗体
    infoWindow.open(map, marker.getPosition());
}

/**
 * 显示订单信息
 * @param {AMap.Map} map - 地图实例
 * @param {Object} order - 订单信息
 * @param {AMap.Marker} marker - 订单标记
 */
function showOrderInfo(map, order, marker) {
    // 创建信息窗体
    const infoWindow = new AMap.InfoWindow({
        content: `
            <div class="info-window order-info">
                <h3>${order.type === 'pickup' ? '取货点' : '送货点'}</h3>
                <p>${order.title}</p>
            </div>
        `,
        offset: new AMap.Pixel(0, -16)
    });
    
    // 打开信息窗体
    infoWindow.open(map, marker.getPosition());
}

/**
 * 获取车辆状态文字
 * @param {string} status - 车辆状态码
 * @returns {string} 状态文字
 */
function getVehicleStatusText(status) {
    const statusMap = {
        'available': '空闲',
        'busy': '运送中',
        'offline': '离线'
    };
    
    return statusMap[status] || status;
}

/**
 * 清除地图标记
 * @param {string} mapType - 地图类型 ('user', 'driver', 'admin')
 */
function clearMapMarkers(mapType) {
    const map = window.mapInstances[`${mapType}-map`];
    if (!map) return;
    
    // 清除车辆标记
    for (const id in mapMarkers.vehicles) {
        if (mapMarkers.vehicles.hasOwnProperty(id)) {
            mapMarkers.vehicles[id].setMap(null);
            delete mapMarkers.vehicles[id];
        }
    }
    
    // 清除订单标记
    for (const id in mapMarkers.orders) {
        if (mapMarkers.orders.hasOwnProperty(id)) {
            mapMarkers.orders[id].setMap(null);
            delete mapMarkers.orders[id];
        }
    }
    
    // 清除路线
    for (const id in mapMarkers.routes) {
        if (mapMarkers.routes.hasOwnProperty(id)) {
            map.remove(mapMarkers.routes[id]);
            delete mapMarkers.routes[id];
        }
    }
}

/**
 * 生成模拟热力图数据
 * @returns {Array} 热力图数据点
 */
function generateHeatmapData() {
    // 基于默认中心点生成随机点
    const centerLng = CONFIG.DEFAULT_CENTER[0];
    const centerLat = CONFIG.DEFAULT_CENTER[1];
    const points = [];
    
    // 生成100个随机点
    for (let i = 0; i < 100; i++) {
        // 随机偏移量，构造热力聚集区域
        let offsetLng, offsetLat;
        
        // 70%的点靠近几个热点区域
        if (Math.random() < 0.7) {
            // 随机选择一个热点
            const hotspotIdx = Math.floor(Math.random() * 3);
            
            if (hotspotIdx === 0) {
                // 热点1：市中心
                offsetLng = (Math.random() - 0.5) * 0.02;
                offsetLat = (Math.random() - 0.5) * 0.02;
            } else if (hotspotIdx === 1) {
                // 热点2：商业区
                offsetLng = 0.03 + (Math.random() - 0.5) * 0.015;
                offsetLat = -0.02 + (Math.random() - 0.5) * 0.015;
            } else {
                // 热点3：交通枢纽
                offsetLng = -0.025 + (Math.random() - 0.5) * 0.01;
                offsetLat = 0.03 + (Math.random() - 0.5) * 0.01;
            }
        } else {
            // 其余30%的点随机分布
            offsetLng = (Math.random() - 0.5) * 0.1;
            offsetLat = (Math.random() - 0.5) * 0.1;
        }
        
        const lng = centerLng + offsetLng;
        const lat = centerLat + offsetLat;
        
        // 随机权重，热点区域权重更高
        const weight = Math.random() * 100;
        
        points.push({
            lng,
            lat,
            count: weight
        });
    }
    
    return points;
}

/**
 * 生成模拟车辆数据
 * @param {number} count - 车辆数量
 * @returns {Array} 车辆数据数组
 */
function generateMockVehicles(count) {
    const vehicles = [];
    const centerLng = CONFIG.DEFAULT_CENTER[0];
    const centerLat = CONFIG.DEFAULT_CENTER[1];
    
    for (let i = 0; i < count; i++) {
        // 随机位置
        const offsetLng = (Math.random() - 0.5) * 0.1;
        const offsetLat = (Math.random() - 0.5) * 0.1;
        
        // 随机状态
        const statusRand = Math.random();
        let status = 'available';
        if (statusRand > 0.7) {
            status = 'busy';
        } else if (statusRand > 0.9) {
            status = 'offline';
        }
        
        // 车辆角度（行驶方向）
        const angle = Math.random() * 360;
        
        vehicles.push({
            id: `v${i + 1}`,
            position: [centerLng + offsetLng, centerLat + offsetLat],
            status,
            angle,
            driver: `司机${i + 1}`,
            capacity: Math.floor(Math.random() * 3) + 1
        });
    }
    
    return vehicles;
}

/**
 * 生成模拟订单数据
 * @param {number} count - 订单数量
 * @returns {Array} 订单数据数组
 */
function generateMockOrders(count) {
    const orders = [];
    const centerLng = CONFIG.DEFAULT_CENTER[0];
    const centerLat = CONFIG.DEFAULT_CENTER[1];
    
    for (let i = 0; i < count; i++) {
        // 订单ID
        const orderId = `ORDER${10000 + i}`;
        
        // 随机取货点
        const pickupOffsetLng = (Math.random() - 0.5) * 0.08;
        const pickupOffsetLat = (Math.random() - 0.5) * 0.08;
        
        // 随机送货点（与取货点保持一定距离）
        const deliveryOffsetLng = (Math.random() - 0.5) * 0.08;
        const deliveryOffsetLat = (Math.random() - 0.5) * 0.08;
        
        orders.push({
            id: orderId,
            orderId,
            pickupPosition: [centerLng + pickupOffsetLng, centerLat + pickupOffsetLat],
            deliveryPosition: [centerLng + deliveryOffsetLng, centerLat + deliveryOffsetLat]
        });
    }
    
    return orders;
}

// 地图移动到指定位置
function moveMapToPosition(mapId, position, zoom = 15) {
    const map = window.mapInstances[mapId];
    if (map) {
        map.setZoomAndCenter(zoom, position);
    }
}

// 导出全局访问函数
window.initializeMaps = initializeMaps;
window.drawRoute = drawRoute;
window.moveMapToPosition = moveMapToPosition;
window.clearMapMarkers = clearMapMarkers;
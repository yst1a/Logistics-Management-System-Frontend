/**
 * 模拟数据模块
 * 为"智送"城市货运智能调度系统提供各类模拟数据
 */

// 模块全局对象
const MockData = {
    // 存储所有生成的模拟数据
    orders: [],
    drivers: [],
    users: [],
    trafficConditions: {},
    
    // 配置参数
    config: {
        // 城市中心坐标（北京市中心）
        centerCoordinates: [116.4074, 39.9042],
        
        // 模拟范围半径（单位：度，约0.1度 ≈ 11公里）
        cityRadius: 0.1,
        
        // 地址数据库
        addressDb: {
            districts: ['朝阳区', '海淀区', '丰台区', '西城区', '东城区', '石景山区', '通州区', '昌平区'],
            streets: ['中关村大街', '金融街', '长安街', '建国路', '三环路', '亮马桥路', '望京西路', '北三环中路'],
            landmarks: ['科技园', '商务中心', '广场', '大厦', '商城', '大厦', '写字楼', '工业园']
        },
        
        // 自动更新配置
        autoUpdate: {
            enabled: true,
            interval: 30000, // 30秒更新一次
            trafficInterval: 60000 // 60秒更新一次交通状况
        },
        
        // 模拟订单数量范围
        orderCount: {min: 20, max: 50},
        
        // 模拟司机数量范围
        driverCount: {min: 15, max: 30},
        
        // 模拟用户数量范围
        userCount: {min: 30, max: 60}
    },
    
    // 实时状态
    state: {
        updateTimers: [],
        lastUpdate: null,
        isInitialized: false
    }
};

/**
 * 初始化模拟数据模块
 * @param {Object} options - 配置选项
 */
function initMockData(options = {}) {
    console.log("初始化模拟数据模块...");
    
    // 合并配置
    if (options.config) {
        MockData.config = { ...MockData.config, ...options.config };
    }
    
    // 清除可能存在的旧定时器
    if (MockData.state.updateTimers.length > 0) {
        MockData.state.updateTimers.forEach(timer => clearInterval(timer));
        MockData.state.updateTimers = [];
    }
    
    // 生成基础数据
    generateMockUsers();
    generateMockDrivers();
    generateMockOrders();
    generateTrafficConditions();
    
    // 如果开启自动更新，设置定时器
    if (MockData.config.autoUpdate.enabled) {
        // 更新订单状态
        const orderTimer = setInterval(() => {
            updateMockOrderStatus();
        }, MockData.config.autoUpdate.interval);
        
        // 更新司机位置
        const driverTimer = setInterval(() => {
            updateMockDriverPositions();
        }, Math.floor(MockData.config.autoUpdate.interval / 2));
        
        // 更新交通状况
        const trafficTimer = setInterval(() => {
            updateTrafficConditions();
        }, MockData.config.autoUpdate.trafficInterval);
        
        // 保存定时器引用
        MockData.state.updateTimers.push(orderTimer, driverTimer, trafficTimer);
    }
    
    MockData.state.lastUpdate = new Date();
    MockData.state.isInitialized = true;
    
    console.log(`模拟数据初始化完成：${MockData.users.length}个用户，${MockData.drivers.length}名司机，${MockData.orders.length}个订单`);
    
    return {
        users: MockData.users.length,
        drivers: MockData.drivers.length,
        orders: MockData.orders.length
    };
}

/**
 * 生成模拟用户数据
 */
function generateMockUsers() {
    // 清空现有用户
    MockData.users = [];
    
    // 随机确定用户数量
    const userCount = getRandomInt(
        MockData.config.userCount.min,
        MockData.config.userCount.max
    );
    
    // 生成用户
    for (let i = 0; i < userCount; i++) {
        const user = {
            id: `user_${generateId(8)}`,
            name: generatePersonName(),
            phone: generatePhoneNumber(),
            email: generateEmail(),
            address: generateAddress(),
            company: generateCompanyName(),
            registerTime: randomPastDate(365), // 过去一年内的随机日期
            lastActiveTime: randomPastDate(30), // 过去一个月内的随机日期
            orderCount: getRandomInt(0, 20),
            defaultAddresses: [
                generateAddress(),
                generateAddress()
            ],
            paymentMethods: generatePaymentMethods()
        };
        
        MockData.users.push(user);
    }
    
    console.log(`生成了${userCount}个模拟用户`);
}

/**
 * 生成模拟司机数据
 */
function generateMockDrivers() {
    // 清空现有司机
    MockData.drivers = [];
    
    // 随机确定司机数量
    const driverCount = getRandomInt(
        MockData.config.driverCount.min,
        MockData.config.driverCount.max
    );
    
    // 车辆类型
    const vehicleTypes = [
        { type: 'small', name: '小型货车', capacity: '1.5吨', length: '4.2m' },
        { type: 'medium', name: '中型货车', capacity: '3吨', length: '5.2m' },
        { type: 'large', name: '大型货车', capacity: '5吨', length: '6.8m' },
        { type: 'van', name: '面包车', capacity: '1吨', length: '3.5m' },
        { type: 'refrigerated', name: '冷藏车', capacity: '2吨', length: '4.5m' }
    ];
    
    // 生成司机
    for (let i = 0; i < driverCount; i++) {
        // 随机位置（在城市范围内）
        const position = generateRandomLocation();
        
        // 随机车辆类型
        const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        
        // 随机工作状态
        const statusOptions = ['available', 'busy', 'offline'];
        const statusWeights = [0.6, 0.3, 0.1]; // 权重决定概率
        const status = weightedRandom(statusOptions, statusWeights);
        
        // 生成司机对象
        const driver = {
            id: `driver_${generateId(8)}`,
            name: generatePersonName(),
            phone: generatePhoneNumber(),
            vehicleId: generateLicensePlate(),
            vehicleType: vehicleType,
            position: position,
            status: status,
            rating: (3 + Math.random() * 2).toFixed(1), // 3-5星评分
            joinTime: randomPastDate(730), // 过去两年内的随机日期
            completedOrders: getRandomInt(10, 500),
            onlineHours: getRandomInt(100, 5000),
            activeOrderIds: [],
            areas: [
                MockData.config.addressDb.districts[
                    Math.floor(Math.random() * MockData.config.addressDb.districts.length)
                ]
            ],
            attributes: {
                hasLifter: Math.random() > 0.7,
                allowsLongDistance: Math.random() > 0.5,
                experienceLevel: ['新手', '经验丰富', '专家'][getRandomInt(0, 2)],
                languages: Math.random() > 0.3 ? ['中文', '英文'] : ['中文']
            }
        };
        
        MockData.drivers.push(driver);
    }
    
    console.log(`生成了${driverCount}名模拟司机`);
}

/**
 * 生成模拟订单数据
 */
function generateMockOrders() {
    // 清空现有订单
    MockData.orders = [];
    
    // 如果没有用户或司机，先生成
    if (MockData.users.length === 0) generateMockUsers();
    if (MockData.drivers.length === 0) generateMockDrivers();
    
    // 随机确定订单数量
    const orderCount = getRandomInt(
        MockData.config.orderCount.min,
        MockData.config.orderCount.max
    );
    
    // 订单状态选项
    const orderStatusOptions = [
        'pending',     // 待处理
        'matching',    // 匹配中
        'assigned',    // 已分配司机
        'pickup',      // 取货中
        'in_transit',  // 运输中
        'delivered',   // 已送达
        'completed',   // 已完成
        'cancelled'    // 已取消
    ];
    
    // 货物类型
    const cargoTypes = [
        '日常用品', '电子产品', '办公用品', '服装', '食品',
        '建材', '家具', '文件', '医疗用品', '易碎品'
    ];
    
    // 生成订单
    for (let i = 0; i < orderCount; i++) {
        // 随机选择用户
        const user = MockData.users[Math.floor(Math.random() * MockData.users.length)];
        
        // 订单创建时间（过去7天内）
        const createdAt = randomPastDate(7);
        
        // 随机选择状态（有权重）
        const statusWeights = [0.1, 0.15, 0.2, 0.15, 0.2, 0.1, 0.05, 0.05];
        const status = weightedRandom(orderStatusOptions, statusWeights);
        
        // 根据状态决定是否有司机
        let driver = null;
        if (['assigned', 'pickup', 'in_transit', 'delivered', 'completed'].includes(status)) {
            // 随机选择一个可用或忙碌的司机
            const availableDrivers = MockData.drivers.filter(d => 
                d.status === 'available' || d.status === 'busy'
            );
            if (availableDrivers.length > 0) {
                driver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)];
                // 更新司机状态和活跃订单
                if (status !== 'completed' && status !== 'delivered') {
                    driver.status = 'busy';
                }
            }
        }
        
        // 取货位置和送货位置
        const pickupLocation = generateRandomLocation();
        const deliveryLocation = generateRandomLocation();
        
        // 计算预估距离（公里）
        const distance = calculateDistance(pickupLocation, deliveryLocation);
        
        // 生成预估费用（按距离和货物体积）
        const volume = 0.5 + Math.random() * 9.5; // 0.5-10立方米
        const basePrice = 20; // 基础费用
        const distancePrice = distance * 2; // 每公里2元
        const volumePrice = volume * 5; // 每立方米5元
        const estimatedPrice = Math.round(basePrice + distancePrice + volumePrice);
        
        // 生成预计送达时间
        const estimatedDeliveryTime = new Date(createdAt);
        estimatedDeliveryTime.setMinutes(
            estimatedDeliveryTime.getMinutes() + 30 + Math.floor(distance * 3)
        );
        
        // 订单对象
        const order = {
            id: `order_${generateId(10)}`,
            userId: user.id,
            userName: user.name,
            userPhone: user.phone,
            status: status,
            createdAt: createdAt,
            updatedAt: new Date(createdAt.getTime() + getRandomInt(1, 60) * 60000), // 1-60分钟后更新
            
            // 地址信息
            pickupAddress: {
                location: pickupLocation,
                address: generateAddress(),
                contact: user.name,
                phone: user.phone,
                notes: Math.random() > 0.7 ? generateRandomNote('pickup') : ''
            },
            deliveryAddress: {
                location: deliveryLocation,
                address: generateAddress(),
                contact: generatePersonName(),
                phone: generatePhoneNumber(),
                notes: Math.random() > 0.7 ? generateRandomNote('delivery') : ''
            },
            
            // 货物信息
            cargo: {
                type: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
                description: `${cargoTypes[Math.floor(Math.random() * cargoTypes.length)]}，${getRandomInt(1, 10)}件`,
                weight: (0.5 + Math.random() * 19.5).toFixed(1), // 0.5-20公斤
                volume: volume.toFixed(1), // 立方米
                isFragile: Math.random() > 0.7,
                requiresRefrigeration: Math.random() > 0.85,
                dimensions: `${20 + Math.floor(Math.random() * 80)}×${20 + Math.floor(Math.random() * 80)}×${10 + Math.floor(Math.random() * 50)}cm`
            },
            
            // 费用信息
            payment: {
                estimatedPrice: estimatedPrice,
                finalPrice: status === 'completed' ? Math.round(estimatedPrice * (0.9 + Math.random() * 0.2)) : null,
                method: ['微信支付', '支付宝', '银行卡', '企业账户'][Math.floor(Math.random() * 4)],
                status: status === 'completed' ? 'paid' : 'unpaid'
            },
            
            // 距离和时间
            distance: distance.toFixed(1),
            estimatedDuration: Math.ceil(distance * 3), // 分钟
            estimatedDeliveryTime: estimatedDeliveryTime,
            
            // 司机信息（如果已分配）
            driver: driver ? {
                id: driver.id,
                name: driver.name,
                phone: driver.phone,
                vehicleId: driver.vehicleId,
                vehicleType: driver.vehicleType.name,
                currentLocation: [...driver.position]
            } : null,
            
            // 评价（如果已完成）
            rating: status === 'completed' ? Math.floor(3 + Math.random() * 3) : null,
            review: status === 'completed' && Math.random() > 0.7 ? generateReview() : null,
            
            // 追踪信息
            tracking: {
                currentStatus: status,
                currentLocation: driver ? [...driver.position] : null,
                lastUpdated: new Date(),
                statusHistory: generateStatusHistory(status, createdAt)
            },
            
            // 优先级
            priority: Math.random() > 0.8 ? 'high' : 'normal',
            
            // 客户要求
            requirements: Math.random() > 0.6 ? generateRequirements() : []
        };
        
        MockData.orders.push(order);
        
        // 如果订单活跃且有司机，添加到司机活跃订单中
        if (driver && ['assigned', 'pickup', 'in_transit'].includes(status)) {
            if (!driver.activeOrderIds.includes(order.id)) {
                driver.activeOrderIds.push(order.id);
            }
        }
    }
    
    console.log(`生成了${orderCount}个模拟订单`);
}

/**
 * 生成交通状况数据
 */
function generateTrafficConditions() {
    // 清空现有交通数据
    MockData.trafficConditions = {};
    
    // 城市区域
    const districts = MockData.config.addressDb.districts;
    
    // 获取当前时间
    const now = new Date();
    const hour = now.getHours();
    
    // 判断是否为高峰期
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    
    // 生成各区域交通情况
    districts.forEach(district => {
        // 基础拥堵系数（1表示正常，大于1表示拥堵）
        let congestionFactor;
        
        if (isPeakHour) {
            // 高峰期交通更拥堵
            congestionFactor = 1.5 + Math.random() * 1.0; // 1.5-2.5
        } else {
            // 非高峰期
            congestionFactor = 0.8 + Math.random() * 0.7; // 0.8-1.5
        }
        
        // 各区域交通状况可能不同
        const districtIndex = districts.indexOf(district);
        const districtFactor = 0.8 + (districtIndex / districts.length) * 0.4;
        
        // 最终拥堵系数
        congestionFactor *= districtFactor;
        
        // 交通状况描述
        let condition;
        if (congestionFactor < 1.0) condition = '畅通';
        else if (congestionFactor < 1.5) condition = '正常';
        else if (congestionFactor < 2.0) condition = '拥堵';
        else condition = '严重拥堵';
        
        // 添加随机道路拥堵点
        const congestionPoints = [];
        const pointCount = isPeakHour ? 
            getRandomInt(2, 5) : getRandomInt(0, 3);
            
        for (let i = 0; i < pointCount; i++) {
            congestionPoints.push({
                location: generateRandomLocation(district),
                level: getRandomInt(1, 4), // 1-4级拥堵
                cause: ['车流量大', '交通事故', '道路施工', '临时管制'][Math.floor(Math.random() * 4)],
                startTime: randomPastDate(0.25), // 过去6小时内
                estimatedEndTime: randomFutureDate(0.25) // 未来6小时内
            });
        }
        
        // 存储区域交通数据
        MockData.trafficConditions[district] = {
            congestionFactor: congestionFactor,
            condition: condition,
            updatedAt: new Date(),
            isPeakHour: isPeakHour,
            congestionPoints: congestionPoints,
            averageSpeed: Math.round(60 / congestionFactor) // 估计平均速度(km/h)
        };
    });
    
    // 生成全市交通概览
    MockData.trafficConditions.cityOverview = {
        averageCongestion: Object.values(MockData.trafficConditions)
            .filter(item => typeof item === 'object' && item.congestionFactor)
            .reduce((sum, item) => sum + item.congestionFactor, 0) / districts.length,
        updatedAt: new Date(),
        isPeakHour: isPeakHour,
        weatherImpact: Math.random() > 0.8 ? getRandomInt(1, 3) : 0 // 天气影响等级
    };
    
    console.log(`生成了交通状况数据，城市整体拥堵系数: ${MockData.trafficConditions.cityOverview.averageCongestion.toFixed(2)}`);
}

/**
 * 更新模拟订单状态
 */
function updateMockOrderStatus() {
    if (MockData.orders.length === 0) return;
    
    console.log("更新订单状态...");
    
    // 遍历所有订单
    MockData.orders.forEach(order => {
        // 只处理活跃订单
        if (['pending', 'matching', 'assigned', 'pickup', 'in_transit'].includes(order.status)) {
            // 根据不同状态有不同的更新概率和规则
            const now = new Date();
            
            switch (order.status) {
                case 'pending':
                    // 待处理订单有70%概率进入匹配中
                    if (Math.random() < 0.7) {
                        order.status = 'matching';
                        order.updatedAt = now;
                        order.tracking.currentStatus = 'matching';
                        order.tracking.statusHistory.push({
                            status: 'matching',
                            time: now,
                            description: '系统正在为您匹配合适的司机'
                        });
                    }
                    break;
                    
                case 'matching':
                    // 匹配中订单有50%概率被分配司机
                    if (Math.random() < 0.5) {
                        // 随机分配一个可用司机
                        const availableDrivers = MockData.drivers.filter(d => 
                            d.status === 'available' && d.activeOrderIds.length < 3
                        );
                        
                        if (availableDrivers.length > 0) {
                            const driver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)];
                            
                            // 更新订单信息
                            order.status = 'assigned';
                            order.updatedAt = now;
                            order.driver = {
                                id: driver.id,
                                name: driver.name,
                                phone: driver.phone,
                                vehicleId: driver.vehicleId,
                                vehicleType: driver.vehicleType.name,
                                currentLocation: [...driver.position]
                            };
                            
                            // 更新追踪信息
                            order.tracking.currentStatus = 'assigned';
                            order.tracking.currentLocation = [...driver.position];
                            order.tracking.statusHistory.push({
                                status: 'assigned',
                                time: now,
                                description: `司机${driver.name}已接单，正在前往取货点`
                            });
                            
                            // 更新司机信息
                            driver.status = 'busy';
                            driver.activeOrderIds.push(order.id);
                        }
                    }
                    break;
                    
                case 'assigned':
                    // 已分配订单有40%概率进入取货中
                    if (Math.random() < 0.4 && order.driver) {
                        order.status = 'pickup';
                        order.updatedAt = now;
                        order.tracking.currentStatus = 'pickup';
                        order.tracking.statusHistory.push({
                            status: 'pickup',
                            time: now,
                            description: '司机已到达取货地点，正在取货'
                        });
                        
                        // 更新位置为取货点
                        if (order.driver) {
                            order.tracking.currentLocation = [...order.pickupAddress.location];
                            
                            // 找到对应司机并更新位置
                            const driver = MockData.drivers.find(d => d.id === order.driver.id);
                            if (driver) {
                                driver.position = [...order.pickupAddress.location];
                            }
                        }
                    }
                    break;
                    
                case 'pickup':
                    // 取货中订单有60%概率进入运输中
                    if (Math.random() < 0.6) {
                        order.status = 'in_transit';
                        order.updatedAt = now;
                        order.tracking.currentStatus = 'in_transit';
                        order.tracking.statusHistory.push({
                            status: 'in_transit',
                            time: now,
                            description: '司机已完成取货，正在送货途中'
                        });
                        
                        // 生成中间位置
                        if (order.pickupAddress.location && order.deliveryAddress.location) {
                            const midPoint = [
                                (order.pickupAddress.location[0] + order.deliveryAddress.location[0]) / 2,
                                (order.pickupAddress.location[1] + order.deliveryAddress.location[1]) / 2
                            ];
                            
                            // 添加一些随机偏移
                            midPoint[0] += (Math.random() - 0.5) * 0.01;
                            midPoint[1] += (Math.random() - 0.5) * 0.01;
                            
                            order.tracking.currentLocation = midPoint;
                            
                            // 更新司机位置
                            if (order.driver) {
                                const driver = MockData.drivers.find(d => d.id === order.driver.id);
                                if (driver) {
                                    driver.position = [...midPoint];
                                }
                            }
                        }
                    }
                    break;
                    
                case 'in_transit':
                    // 运输中订单有30%概率送达
                    if (Math.random() < 0.3) {
                        order.status = 'delivered';
                        order.updatedAt = now;
                        order.tracking.currentStatus = 'delivered';
                        order.tracking.statusHistory.push({
                            status: 'delivered',
                            time: now,
                            description: '货物已送达目的地'
                        });
                        
                        // 更新位置为送货点
                        order.tracking.currentLocation = [...order.deliveryAddress.location];
                        
                        // 更新司机位置和状态
                        if (order.driver) {
                            const driver = MockData.drivers.find(d => d.id === order.driver.id);
                            if (driver) {
                                driver.position = [...order.deliveryAddress.location];
                                
                                // 从活跃订单中移除
                                const orderIndex = driver.activeOrderIds.indexOf(order.id);
                                if (orderIndex !== -1) {
                                    driver.activeOrderIds.splice(orderIndex, 1);
                                }
                                
                                // 如果没有活跃订单，设为可用
                                if (driver.activeOrderIds.length === 0) {
                                    driver.status = 'available';
                                }
                            }
                        }
                        
                        // 已送达的订单有70%概率立即完成
                        if (Math.random() < 0.7) {
                            order.status = 'completed';
                            order.payment.status = 'paid';
                            order.payment.finalPrice = Math.round(order.payment.estimatedPrice * (0.9 + Math.random() * 0.2));
                            order.rating = Math.floor(3 + Math.random() * 3);
                            if (Math.random() > 0.7) {
                                order.review = generateReview();
                            }
                            
                            order.tracking.currentStatus = 'completed';
                            order.tracking.statusHistory.push({
                                status: 'completed',
                                time: new Date(now.getTime() + 60000 + Math.random() * 300000), // 1-6分钟后
                                description: '订单已完成，感谢您的使用'
                            });
                        }
                    }
                    break;
            }
        }
    });
    
    // 计算各状态订单数量
    const statusCounts = {};
    MockData.orders.forEach(order => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    console.log("订单状态更新完成，当前状态分布:", statusCounts);
}

/**
 * 更新模拟司机位置
 */
function updateMockDriverPositions() {
    if (MockData.drivers.length === 0) return;
    
    // 遍历所有司机
    MockData.drivers.forEach(driver => {
        // 只更新在线司机
        if (driver.status === 'offline') return;
        
        // 司机是否有活跃订单
        if (driver.activeOrderIds.length > 0) {
            // 获取第一个活跃订单
            const orderInfo = MockData.orders.find(o => o.id === driver.activeOrderIds[0]);
            
            if (orderInfo) {
                // 根据订单状态决定移动目标
                let targetLocation;
                
                if (orderInfo.status === 'assigned') {
                    // 向取货点移动
                    targetLocation = orderInfo.pickupAddress.location;
                } else if (orderInfo.status === 'in_transit') {
                    // 向送货点移动
                    targetLocation = orderInfo.deliveryAddress.location;
                } else {
                    // 其他状态随机移动
                    targetLocation = generateNearbyLocation(driver.position, 0.005);
                }
                
                // 向目标移动
                moveDriverTowardsLocation(driver, targetLocation);
                
                // 更新订单中的司机位置
                if (orderInfo.driver) {
                    orderInfo.driver.currentLocation = [...driver.position];
                }
                
                // 更新订单追踪信息
                if (orderInfo.tracking) {
                    orderInfo.tracking.currentLocation = [...driver.position];
                    orderInfo.tracking.lastUpdated = new Date();
                }
            }
        } else {
            // 无订单司机随机移动
            moveDriverRandomly(driver);
        }
    });
}

/**
 * 司机向目标位置移动
 * @param {Object} driver - 司机对象
 * @param {Array} targetLocation - 目标位置坐标
 */
function moveDriverTowardsLocation(driver, targetLocation) {
    if (!driver.position || !targetLocation) return;
    
    // 获取当前位置
    const currentLocation = driver.position;
    
    // 计算方向向量
    const direction = [
        targetLocation[0] - currentLocation[0],
        targetLocation[1] - currentLocation[1]
    ];
    
    // 计算距离
    const distance = Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1]);
    
    // 如果已经很接近目标，就不移动了
    if (distance < 0.0005) return; // 约50米
    
    // 移动步长(0.0005-0.001)
    const step = 0.0005 + Math.random() * 0.0005;
    
    // 计算新位置
    const stepRatio = step / distance;
    const newLocation = [
        currentLocation[0] + direction[0] * stepRatio,
        currentLocation[1] + direction[1] * stepRatio
    ];
    
    // 添加一些随机偏移
    newLocation[0] += (Math.random() - 0.5) * 0.0001;
    newLocation[1] += (Math.random() - 0.5) * 0.0001;
    
    // 更新司机位置
    driver.position = newLocation;
}

/**
 * 司机随机移动
 * @param {Object} driver - 司机对象
 */
function moveDriverRandomly(driver) {
    if (!driver.position) return;
    
    // 随机移动方向
    const angle = Math.random() * Math.PI * 2;
    
    // 移动步长(较小)
    const step = 0.0002 + Math.random() * 0.0003;
    
    // 计算新位置
    const newLocation = [
        driver.position[0] + Math.cos(angle) * step,
        driver.position[1] + Math.sin(angle) * step
    ];
    
    // 确保新位置在城市范围内
    const center = MockData.config.centerCoordinates;
    const radius = MockData.config.cityRadius;
    
    const distanceToCenter = Math.sqrt(
        Math.pow(newLocation[0] - center[0], 2) +
        Math.pow(newLocation[1] - center[1], 2)
    );
    
    if (distanceToCenter > radius) {
        // 超出范围，向中心移动
        const toCenter = [
            center[0] - newLocation[0],
            center[1] - newLocation[1]
        ];
        const toCenterDistance = Math.sqrt(toCenter[0] * toCenter[0] + toCenter[1] * toCenter[1]);
        const toCenterStep = 0.001;
        const toCenterRatio = toCenterStep / toCenterDistance;
        
        newLocation[0] += toCenter[0] * toCenterRatio;
        newLocation[1] += toCenter[1] * toCenterRatio;
    }
    
    // 更新司机位置
    driver.position = newLocation;
}

/**
 * 更新交通状况
 */
function updateTrafficConditions() {
    if (!MockData.trafficConditions.cityOverview) {
        generateTrafficConditions();
        return;
    }
    
    console.log("更新交通状况...");
    
    // 获取当前时间
    const now = new Date();
    const hour = now.getHours();
    
    // 判断是否为高峰期
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    
    // 更新各区域交通状况
    Object.keys(MockData.trafficConditions).forEach(key => {
        // 跳过城市概览
        if (key === 'cityOverview') return;
        
        const trafficData = MockData.trafficConditions[key];
        
        // 基于时间段调整拥堵系数
        let newCongestionFactor;
        
        if (isPeakHour) {
            // 高峰期交通更拥堵
            newCongestionFactor = 1.5 + Math.random() * 1.0; // 1.5-2.5
        } else {
            // 非高峰期
            newCongestionFactor = 0.8 + Math.random() * 0.7; // 0.8-1.5
        }
        
        // 添加随机变化
        newCongestionFactor *= (0.9 + Math.random() * 0.2);
        
        // 平滑过渡
        trafficData.congestionFactor = trafficData.congestionFactor * 0.7 + newCongestionFactor * 0.3;
        
        // 更新交通状况描述
        if (trafficData.congestionFactor < 1.0) trafficData.condition = '畅通';
        else if (trafficData.congestionFactor < 1.5) trafficData.condition = '正常';
        else if (trafficData.congestionFactor < 2.0) trafficData.condition = '拥堵';
        else trafficData.condition = '严重拥堵';
        
        // 更新时间
        trafficData.updatedAt = now;
        trafficData.isPeakHour = isPeakHour;
        
        // 更新平均速度
        trafficData.averageSpeed = Math.round(60 / trafficData.congestionFactor);
        
        // 更新拥堵点
        trafficData.congestionPoints.forEach(point => {
            // 一些拥堵点会消失
            if (new Date(point.estimatedEndTime) < now && Math.random() < 0.7) {
                point.level = Math.max(1, point.level - 1);
                
                // 可能完全消失
                if (point.level === 1 && Math.random() < 0.5) {
                    const index = trafficData.congestionPoints.indexOf(point);
                    if (index !== -1) {
                        trafficData.congestionPoints.splice(index, 1);
                    }
                } else {
                    // 更新预计结束时间
                    point.estimatedEndTime = randomFutureDate(0.125); // 3小时内
                }
            }
        });
        
        // 有概率出现新的拥堵点
        if (Math.random() < 0.3 && trafficData.congestionPoints.length < 5) {
            trafficData.congestionPoints.push({
                location: generateRandomLocation(key),
                level: getRandomInt(1, 4), // 1-4级拥堵
                cause: ['车流量大', '交通事故', '道路施工', '临时管制'][Math.floor(Math.random() * 4)],
                startTime: now,
                estimatedEndTime: randomFutureDate(0.25) // 6小时内
            });
        }
    });
    
    // 更新城市交通概览
    MockData.trafficConditions.cityOverview = {
        averageCongestion: Object.values(MockData.trafficConditions)
            .filter(item => typeof item === 'object' && item.congestionFactor)
            .reduce((sum, item) => sum + item.congestionFactor, 0) / 
            Object.keys(MockData.trafficConditions).filter(key => key !== 'cityOverview').length,
        updatedAt: now,
        isPeakHour: isPeakHour,
        weatherImpact: Math.random() > 0.9 ? getRandomInt(1, 3) : 
                      MockData.trafficConditions.cityOverview.weatherImpact // 保持天气影响稳定
    };
    
    console.log(`交通状况更新完成，城市整体拥堵系数: ${MockData.trafficConditions.cityOverview.averageCongestion.toFixed(2)}`);
    
    // 触发交通状况更新事件
    if (typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('trafficUpdate', {
            detail: {
                cityOverview: MockData.trafficConditions.cityOverview,
                timestamp: now
            }
        }));
    }
}

// ========== 辅助函数 ==========

/**
 * 生成随机ID
 * @param {number} length - ID长度
 * @returns {string} 随机ID
 */
function generateId(length = 8) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

/**
 * 生成随机整数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机整数
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成随机位置
 * @param {string} district - 可选的区域名称
 * @returns {Array} [经度, 纬度]
 */
function generateRandomLocation(district) {
    const center = MockData.config.centerCoordinates;
    const radius = MockData.config.cityRadius;
    
    // 如果指定了区域，基于区域调整位置
    let areaBias = [0, 0];
    if (district) {
        const districtIndex = MockData.config.addressDb.districts.indexOf(district);
        if (districtIndex !== -1) {
            // 根据区域索引调整位置偏移
            areaBias = [
                (districtIndex % 3 - 1) * radius * 0.6,
                (Math.floor(districtIndex / 3) - 1) * radius * 0.6
            ];
        }
    }
    
    // 随机角度
    const angle = Math.random() * Math.PI * 2;
    
    // 使用平方根使分布更均匀
    const r = radius * Math.sqrt(Math.random());
    
    return [
        center[0] + r * Math.cos(angle) + areaBias[0],
        center[1] + r * Math.sin(angle) + areaBias[1]
    ];
}

/**
 * 生成附近位置
 * @param {Array} baseLocation - 基准位置
 * @param {number} maxDistance - 最大距离（经纬度）
 * @returns {Array} 新位置
 */
function generateNearbyLocation(baseLocation, maxDistance = 0.01) {
    if (!baseLocation || !Array.isArray(baseLocation)) {
        return generateRandomLocation();
    }
    
    // 随机偏移
    const offsetLng = (Math.random() * 2 - 1) * maxDistance;
    const offsetLat = (Math.random() * 2 - 1) * maxDistance;
    
    return [
        baseLocation[0] + offsetLng,
        baseLocation[1] + offsetLat
    ];
}

/**
 * 计算两点间距离
 * @param {Array} pos1 - 位置1
 * @param {Array} pos2 - 位置2
 * @returns {number} 距离（公里）
 */
function calculateDistance(pos1, pos2) {
    if (!pos1 || !pos2 || !Array.isArray(pos1) || !Array.isArray(pos2)) {
        return 0;
    }
    
    // 使用Haversine公式计算两点间的球面距离
    const R = 6371; // 地球半径(公里)
    const dLat = (pos2[1] - pos1[1]) * Math.PI / 180;
    const dLon = (pos2[0] - pos1[0]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1[1] * Math.PI / 180) * Math.cos(pos2[1] * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
}

/**
 * 生成随机姓名
 * @returns {string} 随机姓名
 */
function generatePersonName() {
    const firstNames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '郑', '孙', '马', '朱', '胡', '林', '郭', '何'];
    const secondNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const secondName = secondNames[Math.floor(Math.random() * secondNames.length)];
    
    return firstName + secondName;
}

/**
 * 生成随机电话号码
 * @returns {string} 随机电话号码
 */
function generatePhoneNumber() {
    const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '150', '151', '152', '157', '158', '159', '182', '183', '187', '188', '189'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    
    let suffix = '';
    for (let i = 0; i < 8; i++) {
        suffix += Math.floor(Math.random() * 10);
    }
    
    return prefix + suffix;
}

/**
 * 生成随机邮箱
 * @returns {string} 随机邮箱
 */
function generateEmail() {
    const domains = ['gmail.com', '163.com', '126.com', 'qq.com', 'outlook.com', 'hotmail.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    const usernameLength = 5 + Math.floor(Math.random() * 7);
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let username = '';
    for (let i = 0; i < usernameLength; i++) {
        username += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return `${username}@${domain}`;
}

/**
 * 生成随机地址
 * @returns {string} 随机地址
 */
function generateAddress() {
    const districts = MockData.config.addressDb.districts;
    const streets = MockData.config.addressDb.streets;
    const landmarks = MockData.config.addressDb.landmarks;
    
    const district = districts[Math.floor(Math.random() * districts.length)];
    const street = streets[Math.floor(Math.random() * streets.length)];
    const landmark = landmarks[Math.floor(Math.random() * landmarks.length)];
    const buildingNum = Math.floor(Math.random() * 100) + 1;
    const unitNum = Math.floor(Math.random() * 5) + 1;
    const roomNum = Math.floor(Math.random() * 30) + 1;
    
    return `北京市${district}${street}${buildingNum}号${landmark}${unitNum}单元${roomNum < 10 ? '0' + roomNum : roomNum}室`;
}

/**
 * 生成随机公司名称
 * @returns {string} 随机公司名称
 */
function generateCompanyName() {
    const prefixes = ['北京', '中国', '华夏', '京东', '联想', '阿里', '腾讯', '百度', '小米', '东方', '西部', '南方', '北方', '中原', '长城'];
    const suffixes = ['科技', '电子', '网络', '软件', '信息', '集团', '商贸', '物流', '教育', '建筑', '金融', '投资', '医疗', '文化', '传媒'];
    const types = ['有限公司', '股份有限公司', '集团', '控股有限公司'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    
    return `${prefix}${suffix}${type}`;
}

/**
 * 生成随机车牌号
 * @returns {string} 随机车牌号
 */
function generateLicensePlate() {
    const provinces = ['京', '津', '沪', '渝', '冀', '豫', '云', '辽', '黑', '湘', '皖', '鲁', '新', '苏', '浙', '赣', '鄂', '桂', '甘', '晋', '蒙', '陕', '吉', '闽', '贵', '粤', '青', '藏', '川', '宁', '琼'];
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    
    const province = provinces[Math.floor(Math.random() * provinces.length)];
    const firstLetter = letters[Math.floor(Math.random() * letters.length)];
    
    let numbers = '';
    for (let i = 0; i < 5; i++) {
        numbers += '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 36)];
    }
    
    return `${province}${firstLetter}·${numbers}`;
}

/**
 * 生成随机过去日期
 * @param {number} daysAgo - 最大天数
 * @returns {Date} 随机过去日期
 */
function randomPastDate(daysAgo) {
    const now = new Date();
    const pastTime = now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000;
    return new Date(pastTime);
}

/**
 * 生成随机未来日期
 * @param {number} daysAhead - 最大天数
 * @returns {Date} 随机未来日期
 */
function randomFutureDate(daysAhead) {
    const now = new Date();
    const futureTime = now.getTime() + Math.random() * daysAhead * 24 * 60 * 60 * 1000;
    return new Date(futureTime);
}

/**
 * 生成随机备注
 * @param {string} type - 备注类型
 * @returns {string} 随机备注
 */
function generateRandomNote(type) {
    const pickupNotes = [
        '请提前电话联系',
        '货物在前台',
        '需要搬运工具',
        '大门密码1234',
        '请走地下车库',
        '请轻拿轻放',
        '请务必当面清点'
    ];
    
    const deliveryNotes = [
        '请送货上门',
        '需要电梯',
        '联系不上请打电话',
        '放在门口即可',
        '收货人下班较晚',
        '需要搬到三楼',
        '需拆箱验货'
    ];
    
    const notes = type === 'pickup' ? pickupNotes : deliveryNotes;
    return notes[Math.floor(Math.random() * notes.length)];
}

/**
 * 生成随机支付方式
 * @returns {Array} 支付方式数组
 */
function generatePaymentMethods() {
    const methods = [
        { type: 'wechat', name: '微信支付', default: Math.random() > 0.5 },
        { type: 'alipay', name: '支付宝', default: Math.random() > 0.7 }
    ];
    
    // 随机添加其他支付方式
    if (Math.random() > 0.5) {
        methods.push({ type: 'bankcard', name: '银行卡', default: false });
    }
    
    if (Math.random() > 0.7) {
        methods.push({ type: 'corporate', name: '企业账户', default: false });
    }
    
    return methods;
}

/**
 * 生成状态历史记录
 * @param {string} currentStatus - 当前状态
 * @param {Date} startTime - 开始时间
 * @returns {Array} 状态历史记录
 */
function generateStatusHistory(currentStatus, startTime) {
    const statusSequence = [
        'pending',     // 待处理
        'matching',    // 匹配中
        'assigned',    // 已分配司机
        'pickup',      // 取货中
        'in_transit',  // 运输中
        'delivered',   // 已送达
        'completed'    // 已完成
    ];
    
    // 特殊情况：已取消
    if (currentStatus === 'cancelled') {
        // 随机在哪个阶段取消
        const cancelPoint = Math.floor(Math.random() * 3); // 0-2之间取消
        
        const history = [];
        let currentTime = new Date(startTime);
        
        for (let i = 0; i <= cancelPoint; i++) {
            // 添加每个经历的状态
            history.push({
                status: statusSequence[i],
                time: new Date(currentTime),
                description: getStatusDescription(statusSequence[i])
            });
            
            // 时间递增
            currentTime = new Date(currentTime.getTime() + getRandomInt(5, 30) * 60000);
        }
        
        // 添加取消状态
        history.push({
            status: 'cancelled',
            time: new Date(currentTime),
            description: '订单已取消'
        });
        
        return history;
    }
    
    // 正常状态
    const currentIndex = statusSequence.indexOf(currentStatus);
    if (currentIndex === -1) return [];
    
    const history = [];
    let currentTime = new Date(startTime);
    
    for (let i = 0; i <= currentIndex; i++) {
        // 添加每个经历的状态
        history.push({
            status: statusSequence[i],
            time: new Date(currentTime),
            description: getStatusDescription(statusSequence[i])
        });
        
        // 时间递增
        currentTime = new Date(currentTime.getTime() + getRandomInt(5, 30) * 60000);
    }
    
    return history;
}

/**
 * 获取状态描述
 * @param {string} status - 状态
 * @returns {string} 状态描述
 */
function getStatusDescription(status) {
    const descriptions = {
        'pending': '订单已提交，等待处理',
        'matching': '系统正在为您匹配合适的司机',
        'assigned': '已为您分配司机，正在前往取货点',
        'pickup': '司机已到达取货点，正在取货',
        'in_transit': '司机已取货，正在配送途中',
        'delivered': '货物已送达目的地',
        'completed': '订单已完成，感谢您的使用',
        'cancelled': '订单已取消'
    };
    
    return descriptions[status] || status;
}

/**
 * 生成随机评价
 * @returns {string} 随机评价
 */
function generateReview() {
    const goodReviews = [
        '司机服务态度很好，准时送达',
        '物品完好无损，很满意',
        '配送速度快，司机很专业',
        '服务一流，下次还会选择',
        '货物完整送达，非常感谢'
    ];
    
    const badReviews = [
        '送货有点慢，其他都好',
        '司机态度一般，但货物完好',
        '没有按预约时间到达，稍有不便',
        '货物有轻微磕碰，但不影响使用'
    ];
    
    // 80%好评，20%差评
    return Math.random() < 0.8 ? 
        goodReviews[Math.floor(Math.random() * goodReviews.length)] :
        badReviews[Math.floor(Math.random() * badReviews.length)];
}

/**
 * 生成客户特殊要求
 * @returns {Array} 特殊要求数组
 */
function generateRequirements() {
    const allRequirements = [
        '需要搬运工协助',
        '请轻拿轻放，物品易碎',
        '需要上楼送货',
        '需当面开箱验货',
        '请准时送达',
        '需提供发票',
        '送达前请提前联系',
        '需要司机提供口罩'
    ];
    
    // 随机选择1-3个要求
    const count = Math.floor(Math.random() * 3) + 1;
    const requirements = [];
    
    // 随机抽取不重复的要求
    const indices = new Set();
    while (indices.size < count) {
        indices.add(Math.floor(Math.random() * allRequirements.length));
    }
    
    // 转换为数组
    indices.forEach(index => {
        requirements.push(allRequirements[index]);
    });
    
    return requirements;
}

/**
 * 带权重的随机选择
 * @param {Array} options - 选项数组
 * @param {Array} weights - 权重数组
 * @returns {*} 选中的选项
 */
function weightedRandom(options, weights) {
    if (!options || !weights || options.length !== weights.length || options.length === 0) {
        return null;
    }
    
    // 计算权重总和
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    // 生成随机值
    const random = Math.random() * totalWeight;
    
    // 计算累积权重并选择
    let cumulativeWeight = 0;
    for (let i = 0; i < options.length; i++) {
        cumulativeWeight += weights[i];
        if (random < cumulativeWeight) {
            return options[i];
        }
    }
    
    // 默认返回最后一个选项
    return options[options.length - 1];
}

/**
 * 获取当前模拟数据状态
 * @returns {Object} 当前数据状态
 */
function getMockDataStatus() {
    return {
        isInitialized: MockData.state.isInitialized,
        lastUpdate: MockData.state.lastUpdate,
        counts: {
            users: MockData.users.length,
            drivers: MockData.drivers.length,
            orders: MockData.orders.length,
            trafficAreas: Object.keys(MockData.trafficConditions).length - 1 // 减去cityOverview
        },
        cityOverview: MockData.trafficConditions.cityOverview || null
    };
}

/**
 * 清除所有模拟数据
 */
function clearMockData() {
    // 清除定时器
    if (MockData.state.updateTimers.length > 0) {
        MockData.state.updateTimers.forEach(timer => clearInterval(timer));
        MockData.state.updateTimers = [];
    }
    
    // 重置数据
    MockData.orders = [];
    MockData.drivers = [];
    MockData.users = [];
    MockData.trafficConditions = {};
    
    // 重置状态
    MockData.state.lastUpdate = null;
    MockData.state.isInitialized = false;
    
    console.log("模拟数据已清除");
}

/**
 * 获取所有模拟订单
 * @param {Object} filters - 可选的筛选条件
 * @returns {Array} 订单数组
 */
function getMockOrders(filters = {}) {
    if (MockData.orders.length === 0) return [];
    
    let filteredOrders = [...MockData.orders];
    
    // 应用筛选条件
    if (filters.status) {
        if (Array.isArray(filters.status)) {
            filteredOrders = filteredOrders.filter(order => 
                filters.status.includes(order.status)
            );
        } else {
            filteredOrders = filteredOrders.filter(order => 
                order.status === filters.status
            );
        }
    }
    
    if (filters.userId) {
        filteredOrders = filteredOrders.filter(order => 
            order.userId === filters.userId
        );
    }
    
    if (filters.driverId) {
        filteredOrders = filteredOrders.filter(order => 
            order.driver && order.driver.id === filters.driverId
        );
    }
    
    if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        filteredOrders = filteredOrders.filter(order => 
            new Date(order.createdAt) >= fromDate
        );
    }
    
    if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        filteredOrders = filteredOrders.filter(order => 
            new Date(order.createdAt) <= toDate
        );
    }
    
    // 排序
    if (filters.sortBy) {
        const sortField = filters.sortBy;
        const sortDirection = filters.sortDirection === 'desc' ? -1 : 1;
        
        filteredOrders.sort((a, b) => {
            // 处理嵌套字段，如"tracking.lastUpdated"
            const fieldsA = sortField.split('.');
            const fieldsB = sortField.split('.');
            
            let valueA = a;
            let valueB = b;
            
            for (const field of fieldsA) {
                if (valueA && valueA[field] !== undefined) {
                    valueA = valueA[field];
                } else {
                    valueA = null;
                    break;
                }
            }
            
            for (const field of fieldsB) {
                if (valueB && valueB[field] !== undefined) {
                    valueB = valueB[field];
                } else {
                    valueB = null;
                    break;
                }
            }
            
            // 处理日期比较
            if (valueA instanceof Date && valueB instanceof Date) {
                return (valueA - valueB) * sortDirection;
            }
            
            // 处理字符串和数字
            if (valueA < valueB) return -1 * sortDirection;
            if (valueA > valueB) return 1 * sortDirection;
            return 0;
        });
    }
    
    // 分页
    if (filters.limit && !isNaN(parseInt(filters.limit))) {
        const limit = parseInt(filters.limit);
        const offset = filters.offset ? parseInt(filters.offset) : 0;
        filteredOrders = filteredOrders.slice(offset, offset + limit);
    }
    
    return filteredOrders;
}

/**
 * 获取所有模拟司机
 * @param {Object} filters - 可选的筛选条件
 * @returns {Array} 司机数组
 */
function getMockDrivers(filters = {}) {
    if (MockData.drivers.length === 0) return [];
    
    let filteredDrivers = [...MockData.drivers];
    
    // 应用筛选条件
    if (filters.status) {
        if (Array.isArray(filters.status)) {
            filteredDrivers = filteredDrivers.filter(driver => 
                filters.status.includes(driver.status)
            );
        } else {
            filteredDrivers = filteredDrivers.filter(driver => 
                driver.status === filters.status
            );
        }
    }
    
    if (filters.vehicleType) {
        filteredDrivers = filteredDrivers.filter(driver => 
            driver.vehicleType.type === filters.vehicleType
        );
    }
    
    if (filters.area) {
        filteredDrivers = filteredDrivers.filter(driver => 
            driver.areas.includes(filters.area)
        );
    }
    
    // 按评分范围筛选
    if (filters.minRating) {
        filteredDrivers = filteredDrivers.filter(driver => 
            parseFloat(driver.rating) >= parseFloat(filters.minRating)
        );
    }
    
    // 是否有活跃订单
    if (filters.hasActiveOrders !== undefined) {
        filteredDrivers = filteredDrivers.filter(driver => 
            (driver.activeOrderIds.length > 0) === filters.hasActiveOrders
        );
    }
    
    // 排序
    if (filters.sortBy) {
        const sortField = filters.sortBy;
        const sortDirection = filters.sortDirection === 'desc' ? -1 : 1;
        
        filteredDrivers.sort((a, b) => {
            // 处理嵌套字段
            const fieldsA = sortField.split('.');
            const fieldsB = sortField.split('.');
            
            let valueA = a;
            let valueB = b;
            
            for (const field of fieldsA) {
                if (valueA && valueA[field] !== undefined) {
                    valueA = valueA[field];
                } else {
                    valueA = null;
                    break;
                }
            }
            
            for (const field of fieldsB) {
                if (valueB && valueB[field] !== undefined) {
                    valueB = valueB[field];
                } else {
                    valueB = null;
                    break;
                }
            }
            
            if (valueA < valueB) return -1 * sortDirection;
            if (valueA > valueB) return 1 * sortDirection;
            return 0;
        });
    }
    
    // 分页
    if (filters.limit && !isNaN(parseInt(filters.limit))) {
        const limit = parseInt(filters.limit);
        const offset = filters.offset ? parseInt(filters.offset) : 0;
        filteredDrivers = filteredDrivers.slice(offset, offset + limit);
    }
    
    return filteredDrivers;
}

/**
 * 获取所有模拟用户
 * @param {Object} filters - 可选的筛选条件
 * @returns {Array} 用户数组
 */
function getMockUsers(filters = {}) {
    if (MockData.users.length === 0) return [];
    
    let filteredUsers = [...MockData.users];
    
    // 应用筛选条件
    if (filters.minOrderCount !== undefined) {
        filteredUsers = filteredUsers.filter(user => 
            user.orderCount >= filters.minOrderCount
        );
    }
    
    if (filters.registerDateFrom) {
        const fromDate = new Date(filters.registerDateFrom);
        filteredUsers = filteredUsers.filter(user => 
            new Date(user.registerTime) >= fromDate
        );
    }
    
    if (filters.registerDateTo) {
        const toDate = new Date(filters.registerDateTo);
        filteredUsers = filteredUsers.filter(user => 
            new Date(user.registerTime) <= toDate
        );
    }
    
    // 排序
    if (filters.sortBy) {
        const sortField = filters.sortBy;
        const sortDirection = filters.sortDirection === 'desc' ? -1 : 1;
        
        filteredUsers.sort((a, b) => {
            // 处理嵌套字段
            const fieldsA = sortField.split('.');
            const fieldsB = sortField.split('.');
            
            let valueA = a;
            let valueB = b;
            
            for (const field of fieldsA) {
                if (valueA && valueA[field] !== undefined) {
                    valueA = valueA[field];
                } else {
                    valueA = null;
                    break;
                }
            }
            
            for (const field of fieldsB) {
                if (valueB && valueB[field] !== undefined) {
                    valueB = valueB[field];
                } else {
                    valueB = null;
                    break;
                }
            }
            
            // 处理日期比较
            if (valueA instanceof Date && valueB instanceof Date) {
                return (valueA - valueB) * sortDirection;
            }
            
            if (valueA < valueB) return -1 * sortDirection;
            if (valueA > valueB) return 1 * sortDirection;
            return 0;
        });
    }
    
    // 分页
    if (filters.limit && !isNaN(parseInt(filters.limit))) {
        const limit = parseInt(filters.limit);
        const offset = filters.offset ? parseInt(filters.offset) : 0;
        filteredUsers = filteredUsers.slice(offset, offset + limit);
    }
    
    return filteredUsers;
}

/**
 * 获取交通状况数据
 * @param {string} district - 可选的区域名称，不提供则返回所有
 * @returns {Object} 交通状况数据
 */
function getTrafficConditions(district) {
    if (Object.keys(MockData.trafficConditions).length === 0) {
        generateTrafficConditions();
    }
    
    if (district) {
        return MockData.trafficConditions[district] || null;
    }
    
    return MockData.trafficConditions;
}

/**
 * 导出API
 */
const MockDataAPI = {
    init: initMockData,
    getStatus: getMockDataStatus,
    clear: clearMockData,
    getOrders: getMockOrders,
    getDrivers: getMockDrivers,
    getUsers: getMockUsers,
    getTrafficConditions: getTrafficConditions,
    generateMockOrders, // 直接导出以供手动生成
    generateMockDrivers,
    generateMockUsers,
    generateTrafficConditions,
    updateMockOrderStatus,
    updateMockDriverPositions,
    updateTrafficConditions,
    config: MockData.config  // 导出配置以便外部修改
};

// 暴露API到全局对象
window.MockDataAPI = MockDataAPI;

// 默认初始化
if (typeof window !== 'undefined' && window.autoInitMockData !== false) {
    setTimeout(() => {
        console.log("自动初始化模拟数据...");
        initMockData();
    }, 500);
}

// 导出API
export default MockDataAPI;
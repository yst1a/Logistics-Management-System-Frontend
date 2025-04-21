/**
 * 订单匹配模拟模块
 * 负责订单与司机的智能匹配，管理订单队列，司机状态等功能
 */

// 模块全局变量
const OrderMatcher = {
    // 订单队列
    orderQueue: [],
    
    // 司机列表
    drivers: [],
    
    // 已分配订单记录
    assignedOrders: {},
    
    // 配置参数
    config: {
        // 匹配更新间隔(毫秒)
        matchingInterval: 3000,
        
        // 司机最大订单数量
        maxOrdersPerDriver: 3,
        
        // 同时处理匹配的最大订单数
        batchSize: 10,
        
        // 开启智能批量匹配
        smartBatching: true,
        
        // 考虑司机历史评分权重(0-1)
        driverRatingWeight: 0.3,
        
        // 考虑距离权重(0-1)
        distanceWeight: 0.5,
        
        // 司机忙碌度权重(0-1)
        driverLoadWeight: 0.2,
        
        // 是否启用实时车辆位置更新
        enableRealTimeUpdates: true,
        
        // 默认匹配半径(公里)
        defaultMatchingRadius: 5
    },
    
    // 匹配状态
    matchingStatus: {
        isRunning: false,
        lastMatchTime: null,
        currentBatch: [],
        metrics: {
            totalMatched: 0,
            totalRejected: 0,
            avgMatchTime: 0,
            avgWaitTime: 0
        }
    }
};

/**
 * 初始化订单匹配模块
 * @param {Object} options - 配置选项
 */
function initOrderMatcher(options = {}) {
    console.log("初始化订单匹配模块...");
    
    // 合并配置选项
    if (options.config) {
        OrderMatcher.config = { ...OrderMatcher.config, ...options.config };
    }
    
    // 如果有初始司机数据，则加载
    if (options.drivers && Array.isArray(options.drivers)) {
        OrderMatcher.drivers = [...options.drivers];
    } else {
        // 否则创建一些模拟司机
        createMockDrivers();
    }
    
    // 开始定期匹配过程
    startMatchingProcess();
    
    // 订阅事件监听
    setupEventListeners();
    
    console.log(`订单匹配模块初始化完成，当前有${OrderMatcher.drivers.length}名司机可用`);
}

/**
 * 创建模拟司机数据
 */
function createMockDrivers() {
    // 清空现有司机
    OrderMatcher.drivers = [];
    
    // 模拟司机数量
    const driverCount = 20 + Math.floor(Math.random() * 10);
    
    // 车辆类型
    const vehicleTypes = ['small', 'medium', 'large'];
    
    // 在城市范围内随机生成司机位置
    // 假设中心位置
    const centerLat = 39.9042;
    const centerLng = 116.4074;
    const cityRadius = 0.1; // 约10公里
    
    for (let i = 0; i < driverCount; i++) {
        // 生成随机位置
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * cityRadius;
        const lat = centerLat + Math.cos(angle) * distance;
        const lng = centerLng + Math.sin(angle) * distance;
        
        // 随机确定车辆类型
        const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        
        // 随机生成车牌号
        const plateNumber = generateRandomPlate();
        
        // 创建司机对象
        const driver = {
            id: `driver_${i + 1}`,
            name: `司机${i + 1}`,
            phone: `1${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`,
            position: [lng, lat],
            vehicleType: vehicleType,
            plateNumber: plateNumber,
            status: 'available', // available, busy, offline
            rating: 3 + Math.random() * 2, // 3-5星评分
            activeOrders: [],
            completedOrders: [],
            lastUpdateTime: new Date(),
            // 司机特性
            traits: {
                efficiency: 0.5 + Math.random() * 0.5, // 效率因子(0.5-1.0)
                reliability: 0.7 + Math.random() * 0.3  // 可靠性因子(0.7-1.0)
            }
        };
        
        OrderMatcher.drivers.push(driver);
    }
    
    console.log(`创建了${driverCount}名模拟司机`);
}

/**
 * 生成随机车牌号
 * @returns {string} 车牌号
 */
function generateRandomPlate() {
    const provinces = ['京', '津', '沪', '渝', '冀', '豫', '云', '辽', '黑', '湘'];
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    
    const province = provinces[Math.floor(Math.random() * provinces.length)];
    const letter = letters[Math.floor(Math.random() * letters.length)];
    
    // 生成5位数字字母组合
    let tail = '';
    const chars = '0123456789' + letters;
    for (let i = 0; i < 5; i++) {
        tail += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return `${province}${letter}·${tail}`;
}

/**
 * 启动匹配过程
 */
function startMatchingProcess() {
    if (OrderMatcher.matchingStatus.isRunning) return;
    
    console.log("启动订单匹配流程");
    
    // 设置定期执行匹配
    const intervalId = setInterval(() => {
        processMatchingBatch();
    }, OrderMatcher.config.matchingInterval);
    
    // 更新状态
    OrderMatcher.matchingStatus.isRunning = true;
    OrderMatcher.matchingStatus.intervalId = intervalId;
}

/**
 * 停止匹配过程
 */
function stopMatchingProcess() {
    if (!OrderMatcher.matchingStatus.isRunning) return;
    
    // 清除定时器
    clearInterval(OrderMatcher.matchingStatus.intervalId);
    
    // 更新状态
    OrderMatcher.matchingStatus.isRunning = false;
    OrderMatcher.matchingStatus.intervalId = null;
    
    console.log("订单匹配流程已停止");
}

/**
 * 处理一批订单匹配
 */
function processMatchingBatch() {
    // 如果队列为空或没有可用司机，跳过本次匹配
    if (OrderMatcher.orderQueue.length === 0) {
        return;
    }
    
    // 计算可用司机数量
    const availableDrivers = OrderMatcher.drivers.filter(driver => 
        driver.status === 'available' || 
        (driver.status === 'busy' && driver.activeOrders.length < OrderMatcher.config.maxOrdersPerDriver)
    );
    
    if (availableDrivers.length === 0) {
        console.log("当前没有可用司机，跳过匹配");
        return;
    }
    
    // 开始时间
    const startTime = new Date();
    OrderMatcher.matchingStatus.lastMatchTime = startTime;
    
    // 准备要处理的订单批次
    const batchSize = Math.min(OrderMatcher.config.batchSize, OrderMatcher.orderQueue.length);
    OrderMatcher.matchingStatus.currentBatch = OrderMatcher.orderQueue.slice(0, batchSize);
    
    console.log(`开始匹配处理，当前队列长度: ${OrderMatcher.orderQueue.length}，本批次: ${batchSize}`);
    
    // 批量匹配或逐个匹配
    if (OrderMatcher.config.smartBatching && batchSize > 1) {
        // 智能批量匹配算法
        batchMatchOrders(OrderMatcher.matchingStatus.currentBatch, availableDrivers);
    } else {
        // 单个匹配
        let matchedCount = 0;
        
        // 尝试为每个订单找到合适的司机
        for (let i = 0; i < batchSize; i++) {
            const order = OrderMatcher.orderQueue[i];
            const matchResult = findBestDriverForOrder(order, availableDrivers);
            
            if (matchResult.matched) {
                // 分配订单
                assignOrderToDriver(order, matchResult.driver);
                matchedCount++;
                
                // 从队列中移除
                OrderMatcher.orderQueue.splice(OrderMatcher.orderQueue.indexOf(order), 1);
                i--; // 调整索引
                batchSize--;
                
                // 更新可用司机列表
                if (matchResult.driver.activeOrders.length >= OrderMatcher.config.maxOrdersPerDriver) {
                    const driverIndex = availableDrivers.findIndex(d => d.id === matchResult.driver.id);
                    if (driverIndex !== -1) {
                        availableDrivers.splice(driverIndex, 1);
                    }
                }
            }
        }
        
        console.log(`单个匹配完成，成功匹配 ${matchedCount} 个订单`);
    }
    
    // 计算匹配用时
    const endTime = new Date();
    const matchingTime = (endTime - startTime) / 1000;
    
    // 更新统计指标
    updateMatchingMetrics(matchingTime);
    
    console.log(`本次匹配用时: ${matchingTime.toFixed(2)}秒`);
}

/**
 * 更新匹配统计指标
 * @param {number} matchingTime - 本次匹配用时（秒）
 */
function updateMatchingMetrics(matchingTime) {
    const metrics = OrderMatcher.matchingStatus.metrics;
    
    // 更新平均匹配时间
    const totalMatched = metrics.totalMatched;
    if (totalMatched > 0) {
        metrics.avgMatchTime = (metrics.avgMatchTime * (totalMatched - 1) + matchingTime) / totalMatched;
    } else {
        metrics.avgMatchTime = matchingTime;
    }
    
    // 计算队列中订单的平均等待时间
    if (OrderMatcher.orderQueue.length > 0) {
        const now = new Date();
        let totalWaitTime = 0;
        
        OrderMatcher.orderQueue.forEach(order => {
            totalWaitTime += (now - new Date(order.createdAt)) / 1000 / 60; // 转换为分钟
        });
        
        metrics.avgWaitTime = totalWaitTime / OrderMatcher.orderQueue.length;
    }
}

/**
 * 批量匹配多个订单
 * @param {Array} orders - 要匹配的订单列表
 * @param {Array} availableDrivers - 可用司机列表
 */
function batchMatchOrders(orders, availableDrivers) {
    console.log(`开始批量匹配 ${orders.length} 个订单与 ${availableDrivers.length} 名司机`);
    
    // 创建订单与司机的得分矩阵
    const scoreMatrix = [];
    
    // 计算每个订单对每个司机的匹配得分
    for (const order of orders) {
        const orderScores = [];
        
        for (const driver of availableDrivers) {
            const score = calculateMatchingScore(order, driver);
            orderScores.push({
                orderId: order.id,
                driverId: driver.id,
                score: score
            });
        }
        
        // 按得分排序
        orderScores.sort((a, b) => b.score - a.score);
        scoreMatrix.push(orderScores);
    }
    
    // 使用贪心算法进行分配
    const assignments = [];
    const assignedDrivers = new Set();
    const assignedOrders = new Set();
    
    // 按照订单优先级排序
    scoreMatrix.sort((a, b) => {
        // 优先级可以基于等待时间、订单紧急程度等
        const orderA = orders.find(o => o.id === a[0].orderId);
        const orderB = orders.find(o => o.id === b[0].orderId);
        
        // 如果是急单，提高优先级
        if (orderA.urgent && !orderB.urgent) return -1;
        if (!orderA.urgent && orderB.urgent) return 1;
        
        // 按等待时间排序
        return new Date(orderA.createdAt) - new Date(orderB.createdAt);
    });
    
    // 为每个订单分配最佳司机
    for (const orderScores of scoreMatrix) {
        if (orderScores.length === 0) continue;
        
        const orderId = orderScores[0].orderId;
        
        // 如果订单已经被分配，跳过
        if (assignedOrders.has(orderId)) continue;
        
        // 尝试分配给最高得分且未分配的司机
        for (const match of orderScores) {
            if (!assignedDrivers.has(match.driverId) && match.score > 0) {
                assignments.push(match);
                assignedDrivers.add(match.driverId);
                assignedOrders.add(orderId);
                break;
            }
        }
    }
    
    // 执行分配
    let matchedCount = 0;
    for (const assignment of assignments) {
        const order = orders.find(o => o.id === assignment.orderId);
        const driver = availableDrivers.find(d => d.id === assignment.driverId);
        
        if (order && driver) {
            assignOrderToDriver(order, driver);
            matchedCount++;
            
            // 从队列中移除
            const orderIndex = OrderMatcher.orderQueue.indexOf(order);
            if (orderIndex !== -1) {
                OrderMatcher.orderQueue.splice(orderIndex, 1);
            }
        }
    }
    
    console.log(`批量匹配完成，成功匹配 ${matchedCount} 个订单`);
    OrderMatcher.matchingStatus.metrics.totalMatched += matchedCount;
}

/**
 * 为订单寻找最佳司机
 * @param {Object} order - 订单对象
 * @param {Array} availableDrivers - 可用司机列表
 * @returns {Object} 匹配结果
 */
function findBestDriverForOrder(order, availableDrivers) {
    // 如果没有可用司机，返回未匹配
    if (!availableDrivers || availableDrivers.length === 0) {
        return { matched: false };
    }
    
    let bestDriver = null;
    let bestScore = -1;
    
    // 计算每个司机的匹配得分
    for (const driver of availableDrivers) {
        const score = calculateMatchingScore(order, driver);
        
        // 得分为0表示不匹配
        if (score <= 0) continue;
        
        if (score > bestScore) {
            bestScore = score;
            bestDriver = driver;
        }
    }
    
    // 检查是否找到合适的司机
    if (bestDriver && bestScore > 0) {
        return {
            matched: true,
            driver: bestDriver,
            score: bestScore
        };
    } else {
        return { matched: false };
    }
}

/**
 * 计算订单与司机的匹配得分
 * @param {Object} order - 订单对象
 * @param {Object} driver - 司机对象
 * @returns {number} 匹配得分(0-100)，0表示不匹配
 */
function calculateMatchingScore(order, driver) {
    // 判断基本匹配条件
    
    // 1. 车辆类型是否匹配
    if (order.cargoType === 'large' && driver.vehicleType === 'small') {
        return 0; // 大货物不能用小车运送
    }
    
    // 2. 司机是否可接单
    if (driver.status === 'offline' || 
        (driver.activeOrders.length >= OrderMatcher.config.maxOrdersPerDriver)) {
        return 0; // 司机不可用
    }
    
    // 初始得分
    let score = 50;
    
    // 3. 距离因素
    const distanceToPickup = calculateDistance(driver.position, order.pickupPosition);
    
    // 距离超过最大匹配半径
    const matchingRadius = order.urgent ? 
        OrderMatcher.config.defaultMatchingRadius * 1.5 : // 急单扩大范围
        OrderMatcher.config.defaultMatchingRadius;
        
    if (distanceToPickup > matchingRadius) {
        return 0;
    }
    
    // 距离得分(距离越近得分越高)
    const distanceScore = Math.max(0, 100 - (distanceToPickup / matchingRadius) * 100);
    score += distanceScore * OrderMatcher.config.distanceWeight;
    
    // 4. 司机评分因素
    const ratingScore = (driver.rating - 3) * 20; // 3-5星转换为0-40分
    score += ratingScore * OrderMatcher.config.driverRatingWeight;
    
    // 5. 司机忙碌度因素
    const busyScore = (1 - (driver.activeOrders.length / OrderMatcher.config.maxOrdersPerDriver)) * 100;
    score += busyScore * OrderMatcher.config.driverLoadWeight;
    
    // 6. 特殊因素
    
    // 紧急订单优先级
    if (order.urgent) {
        score += 20; // 提高紧急订单的匹配优先级
    }
    
    // 司机特性
    if (driver.traits) {
        if (order.urgent && driver.traits.efficiency > 0.8) {
            score += 10; // 高效率司机更适合急单
        }
        
        score += driver.traits.reliability * 10; // 可靠性提高得分
    }
    
    return Math.min(100, score); // 得分上限100
}

/**
 * 将订单分配给司机
 * @param {Object} order - 订单对象
 * @param {Object} driver - 司机对象
 */
function assignOrderToDriver(order, driver) {
    // 更新订单状态
    order.status = 'assigned';
    order.assignedDriver = {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        plateNumber: driver.plateNumber,
        vehicleType: driver.vehicleType
    };
    order.assignedAt = new Date();
    
    // 如果没有追踪信息，初始化
    if (!order.trackingInfo) {
        order.trackingInfo = {
            currentLocation: [...driver.position], // 复制数组
            updatedAt: new Date(),
            estimatedArrival: null
        };
    }
    
    // 更新司机状态
    driver.activeOrders.push({
        id: order.id,
        pickupAddress: order.pickupAddress,
        deliveryAddress: order.deliveryAddress,
        assignedAt: new Date()
    });
    
    // 如果司机活跃订单达到上限，设置为繁忙状态
    if (driver.activeOrders.length >= OrderMatcher.config.maxOrdersPerDriver) {
        driver.status = 'busy';
    }
    
    // 记录分配
    OrderMatcher.assignedOrders[order.id] = {
        driverId: driver.id,
        assignedAt: new Date()
    };
    
    // 计算预计到达时间
    calculateETA(order, driver);
    
    console.log(`订单 ${order.id} 已分配给司机 ${driver.name}(${driver.id})`);
    
    // 触发订单分配事件
    if (typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('orderAssigned', {
            detail: { order, driver }
        }));
    }
    
    // 更新匹配统计
    OrderMatcher.matchingStatus.metrics.totalMatched++;
    
    // 模拟发送通知给司机
    setTimeout(() => {
        // 实际系统会通过消息系统通知司机
        console.log(`向司机 ${driver.id} 发送订单通知`);
        
        // 模拟司机接受订单的概率(根据司机可靠性)
        const acceptProbability = driver.traits ? driver.traits.reliability : 0.9;
        
        if (Math.random() <= acceptProbability) {
            console.log(`司机 ${driver.id} 已接受订单 ${order.id}`);
            
            // 触发司机接单事件
            if (typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new CustomEvent('driverAcceptedOrder', {
                    detail: { order, driver }
                }));
            }
        } else {
            console.log(`司机 ${driver.id} 拒绝订单 ${order.id}，将重新分配`);
            
            // 恢复司机状态
            const orderIndex = driver.activeOrders.findIndex(o => o.id === order.id);
            if (orderIndex !== -1) {
                driver.activeOrders.splice(orderIndex, 1);
                
                // 如果司机没有活跃订单，恢复为可用状态
                if (driver.activeOrders.length === 0) {
                    driver.status = 'available';
                }
            }
            
            // 重新加入队列
            order.status = 'pending';
            delete order.assignedDriver;
            delete order.assignedAt;
            
            // 将拒绝的订单重新加入队列头部
            OrderMatcher.orderQueue.unshift(order);
            
            // 删除分配记录
            delete OrderMatcher.assignedOrders[order.id];
            
            // 更新统计
            OrderMatcher.matchingStatus.metrics.totalRejected++;
            
            // 触发司机拒单事件
            if (typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new CustomEvent('driverRejectedOrder', {
                    detail: { order, driver }
                }));
            }
        }
    }, 1000 + Math.random() * 2000); // 模拟1-3秒的延迟
}

/**
 * 计算订单的预计到达时间
 * @param {Object} order - 订单对象
 * @param {Object} driver - 司机对象
 */
function calculateETA(order, driver) {
    // 调用路线规划模块计算ETA
    if (window.RoutePlanner && typeof window.RoutePlanner.planRoute === 'function') {
        // 规划取货路线
        window.RoutePlanner.planRoute(driver.position, order.pickupPosition)
            .then(pickupRoute => {
                // 规划送货路线
                return window.RoutePlanner.planRoute(order.pickupPosition, order.deliveryPosition)
                    .then(deliveryRoute => {
                        // 计算总时间(秒)
                        const totalTime = pickupRoute.duration + deliveryRoute.duration;
                        
                        // 计算预计到达时间
                        const now = new Date();
                        const pickupTime = new Date(now.getTime() + pickupRoute.duration * 1000);
                        const deliveryTime = new Date(now.getTime() + totalTime * 1000);
                        
                        // 更新追踪信息
                        order.trackingInfo.estimatedPickupTime = pickupTime;
                        order.trackingInfo.estimatedArrival = deliveryTime;
                        order.trackingInfo.distance = {
                            toPickup: pickupRoute.distance,
                            toDelivery: deliveryRoute.distance,
                            total: pickupRoute.distance + deliveryRoute.distance
                        };
                        
                        console.log(`订单 ${order.id} 预计取货时间: ${pickupTime.toLocaleTimeString()}, 送达时间: ${deliveryTime.toLocaleTimeString()}`);
                    });
            })
            .catch(error => {
                console.error("计算ETA错误:", error);
                
                // 简单预估
                const distance = calculateDistance(driver.position, order.pickupPosition);
                const estimatedMinutes = Math.ceil(distance * 2); // 简单估计，每公里2分钟
                
                const now = new Date();
                const estimatedTime = new Date(now.getTime() + estimatedMinutes * 60 * 1000);
                
                order.trackingInfo.estimatedPickupTime = estimatedTime;
                order.trackingInfo.estimatedArrival = new Date(estimatedTime.getTime() + 30 * 60 * 1000); // 简单增加30分钟送达
            });
    } else {
        // 路线规划模块不可用，使用简单估算
        const distance = calculateDistance(driver.position, order.pickupPosition);
        const estimatedMinutes = Math.ceil(distance * 2); // 简单估计，每公里2分钟
        
        const now = new Date();
        const estimatedTime = new Date(now.getTime() + estimatedMinutes * 60 * 1000);
        
        order.trackingInfo.estimatedPickupTime = estimatedTime;
        order.trackingInfo.estimatedArrival = new Date(estimatedTime.getTime() + 30 * 60 * 1000); // 简单增加30分钟送达
    }
}

/**
 * 添加新订单到队列
 * @param {Object} order - 订单对象
 * @returns {Promise<Object>} 处理结果
 */
function addOrderToQueue(order) {
    return new Promise((resolve, reject) => {
        if (!order || !order.id) {
            reject(new Error("订单数据无效"));
            return;
        }
        
        // 补全订单信息
        const now = new Date();
        const completeOrder = {
            ...order,
            status: 'pending',
            createdAt: order.createdAt || now,
            updatedAt: now
        };
        
        // 插入队列
        OrderMatcher.orderQueue.push(completeOrder);
        
        console.log(`订单 ${completeOrder.id} 已加入匹配队列，当前队列长度: ${OrderMatcher.orderQueue.length}`);
        
        // 如果队列之前为空，可以触发立即匹配
        if (OrderMatcher.orderQueue.length === 1 && OrderMatcher.matchingStatus.isRunning) {
            setTimeout(processMatchingBatch, 0);
        }
        
        resolve({
            success: true,
            orderId: completeOrder.id,
            message: "订单已加入匹配队列",
            queuePosition: OrderMatcher.orderQueue.length,
            estimatedWaitTime: estimateWaitTime()
        });
    });
}

/**
 * 估计订单等待时间
 * @returns {number} 估计等待时间(分钟)
 */
function estimateWaitTime() {
    const metrics = OrderMatcher.matchingStatus.metrics;
    
    // 基础等待时间：2分钟
    let waitTime = 2;
    
    // 根据队列长度调整
    waitTime += OrderMatcher.orderQueue.length / 10;
    
    // 根据平均等待时间调整
    if (metrics.avgWaitTime > 0) {
        waitTime = (waitTime + metrics.avgWaitTime) / 2;
    }
    
    // 根据可用司机数量调整
    const availableDriverCount = OrderMatcher.drivers.filter(d => 
        d.status === 'available' || 
        (d.status === 'busy' && d.activeOrders.length < OrderMatcher.config.maxOrdersPerDriver)
    ).length;
    
    if (availableDriverCount > 0) {
        waitTime = waitTime * (10 / (10 + availableDriverCount));
    } else {
        waitTime *= 2; // 没有司机时等待时间翻倍
    }
    
    return Math.ceil(waitTime);
}

/**
 * 更新司机位置
 * @param {string} driverId - 司机ID
 * @param {Array} position - 新位置[经度, 纬度]
 * @returns {boolean} 是否更新成功
 */
function updateDriverPosition(driverId, position) {
    const driver = OrderMatcher.drivers.find(d => d.id === driverId);
    
    if (!driver) {
        console.warn(`找不到司机 ${driverId}`);
        return false;
    }
    
    // 更新位置
    driver.position = position;
    driver.lastUpdateTime = new Date();
    
    // 更新司机活跃订单的追踪信息
    if (driver.activeOrders && driver.activeOrders.length > 0) {
        driver.activeOrders.forEach(orderInfo => {
            // 查找对应订单
            const order = OrderMatcher.orderQueue.find(o => o.id === orderInfo.id) || 
                         Object.values(OrderMatcher.assignedOrders).find(o => o.id === orderInfo.id);
            
            if (order && order.trackingInfo) {
                order.trackingInfo.currentLocation = [...position];
                order.trackingInfo.updatedAt = new Date();
            }
        });
    }
    
    return true;
}

/**
 * 更新司机状态
 * @param {string} driverId - 司机ID
 * @param {string} status - 新状态: 'available', 'busy', 'offline'
 * @returns {boolean} 是否更新成功
 */
function updateDriverStatus(driverId, status) {
    const driver = OrderMatcher.drivers.find(d => d.id === driverId);
    
    if (!driver) {
        console.warn(`找不到司机 ${driverId}`);
        return false;
    }
    
    // 更新状态
    const oldStatus = driver.status;
    driver.status = status;
    
    // 离线时清空活跃订单
    if (status === 'offline' && driver.activeOrders.length > 0) {
        console.warn(`司机 ${driverId} 离线，${driver.activeOrders.length}个活跃订单将被重新分配`);
        
        // 重新分配他的订单
        driver.activeOrders.forEach(orderInfo => {
            // 恢复订单状态
            const orderInQueue = OrderMatcher.orderQueue.find(o => o.id === orderInfo.id);
            
            if (orderInQueue) {
                orderInQueue.status = 'pending';
                delete orderInQueue.assignedDriver;
                delete orderInQueue.assignedAt;
            } 
            // 可能需要从其他地方获取订单，如订单历史记录等
        });
        
        // 清空活跃订单
        driver.activeOrders = [];
    }
    
    console.log(`司机 ${driverId} 状态从 ${oldStatus} 更新为 ${status}`);
    
    return true;
}

/**
 * 完成订单
 * @param {string} orderId - 订单ID
 * @param {Object} completionData - 完成信息
 * @returns {Promise<Object>} 处理结果
 */
function completeOrder(orderId, completionData = {}) {
    return new Promise((resolve, reject) => {
        // 查找订单分配记录
        const assignRecord = OrderMatcher.assignedOrders[orderId];
        
        if (!assignRecord) {
            reject(new Error(`找不到订单 ${orderId} 的分配记录`));
            return;
        }
        
        // 查找司机
        const driver = OrderMatcher.drivers.find(d => d.id === assignRecord.driverId);
        
        if (!driver) {
            reject(new Error(`找不到负责订单的司机 ${assignRecord.driverId}`));
            return;
        }
        
        // 更新订单状态
        const now = new Date();
        const completionInfo = {
            status: 'completed',
            completedAt: now,
            signature: completionData.signature || null,
            comments: completionData.comments || null,
            rating: completionData.rating || null
        };
        
        // 从司机活跃订单中移除
        const orderIndex = driver.activeOrders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            // 添加到已完成订单
            driver.completedOrders.push({
                ...driver.activeOrders[orderIndex],
                completedAt: now
            });
            
            // 从活跃订单中移除
            driver.activeOrders.splice(orderIndex, 1);
            
            // 如果司机没有活跃订单，更新状态为可用
            if (driver.activeOrders.length === 0 && driver.status !== 'offline') {
                driver.status = 'available';
            }
        }
        
        // 从分配记录中移除
        delete OrderMatcher.assignedOrders[orderId];
        
        // 如果有评分，更新司机评分
        if (completionData.rating) {
            // 使用加权平均值更新司机评分
            const completedCount = driver.completedOrders.length;
            if (completedCount > 0) {
                // 评分权重：新评分占20%
                driver.rating = driver.rating * 0.8 + completionData.rating * 0.2;
            }
        }
        
        console.log(`订单 ${orderId} 已完成`);
        
        // 触发订单完成事件
        if (typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('orderCompleted', {
                detail: { orderId, completionInfo, driver }
            }));
        }
        
        resolve({
            success: true,
            orderId,
            completionInfo,
            message: "订单已成功完成"
        });
    });
}

/**
 * 取消订单
 * @param {string} orderId - 订单ID
 * @param {string} reason - 取消原因
 * @returns {Promise<Object>} 处理结果
 */
function cancelOrder(orderId, reason = "") {
    return new Promise((resolve, reject) => {
        // 尝试从队列中找到订单
        const orderIndex = OrderMatcher.orderQueue.findIndex(o => o.id === orderId);
        
        if (orderIndex !== -1) {
            // 订单在队列中，直接移除
            const order = OrderMatcher.orderQueue[orderIndex];
            OrderMatcher.orderQueue.splice(orderIndex, 1);
            
            console.log(`队列中的订单 ${orderId} 已取消`);
            
            resolve({
                success: true,
                orderId,
                status: 'cancelled',
                message: "队列中的订单已取消",
                refund: true
            });
            return;
        }
        
        // 查看是否是已分配的订单
        const assignRecord = OrderMatcher.assignedOrders[orderId];
        
        if (assignRecord) {
            // 查找司机
            const driver = OrderMatcher.drivers.find(d => d.id === assignRecord.driverId);
            
            if (driver) {
                // 从司机活跃订单中移除
                const driverOrderIndex = driver.activeOrders.findIndex(o => o.id === orderId);
                if (driverOrderIndex !== -1) {
                    driver.activeOrders.splice(driverOrderIndex, 1);
                    
                    // 更新司机状态
                    if (driver.activeOrders.length === 0 && driver.status !== 'offline') {
                        driver.status = 'available';
                    }
                }
                
                // 删除分配记录
                delete OrderMatcher.assignedOrders[orderId];
                
                console.log(`已分配的订单 ${orderId} 已取消，司机ID: ${driver.id}`);
                
                // 取消通知
                if (typeof window.dispatchEvent === 'function') {
                    window.dispatchEvent(new CustomEvent('orderCancelled', {
                        detail: { orderId, driverId: driver.id, reason }
                    }));
                }
                
                // 判断是否可以全额退款
                const now = new Date();
                const assignTime = new Date(assignRecord.assignedAt);
                const minutesSinceAssign = (now - assignTime) / (1000 * 60);
                
                const fullRefund = minutesSinceAssign < 5; // 5分钟内取消可全额退款
                
                resolve({
                    success: true,
                    orderId,
                    status: 'cancelled',
                    message: "已分配的订单已取消",
                    refund: fullRefund
                });
                return;
            }
        }
        
        // 找不到订单
        reject(new Error(`找不到订单 ${orderId}`));
    });
}

/**
 * 计算两点间距离
 * @param {Array} pos1 - 位置1 [经度, 纬度]
 * @param {Array} pos2 - 位置2 [经度, 纬度]
 * @returns {number} 距离(公里)
 */
function calculateDistance(pos1, pos2) {
    if (!pos1 || !pos2 || !Array.isArray(pos1) || !Array.isArray(pos2)) {
        return 0;
    }
    
    // 使用球面余弦定理计算距离
    const R = 6371; // 地球半径(公里)
    const lat1 = pos1[1] * Math.PI / 180;
    const lat2 = pos2[1] * Math.PI / 180;
    const lon1 = pos1[0] * Math.PI / 180;
    const lon2 = pos2[0] * Math.PI / 180;
    
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
}

/**
 * 设置事件监听
 */
function setupEventListeners() {
    // 监听路径规划模块的交通更新事件
    if (typeof window.addEventListener === 'function') {
        window.addEventListener('trafficupdate', handleTrafficUpdate);
        
        // 监听司机位置更新事件(可能由其他模块触发)
        window.addEventListener('driverPositionUpdate', function(event) {
            if (event.detail && event.detail.driverId && event.detail.position) {
                updateDriverPosition(event.detail.driverId, event.detail.position);
            }
        });
    }
}

/**
 * 处理交通更新事件
 * @param {Event} event - 交通更新事件
 */
function handleTrafficUpdate(event) {
    // 在实际应用中，这里会根据交通情况调整匹配策略
    // 例如在拥堵时段增加匹配半径等
    
    if (event.detail && event.detail.isPeakHour) {
        // 高峰期策略
        OrderMatcher.config.defaultMatchingRadius *= 1.3; // 临时增加匹配半径
        console.log("交通高峰期，调整匹配半径为", OrderMatcher.config.defaultMatchingRadius);
    } else {
        // 恢复标准设置
        OrderMatcher.config.defaultMatchingRadius = 5; // 恢复默认值
    }
}

/**
 * 获取实时统计数据
 * @returns {Object} 统计数据
 */
function getMatchingStatistics() {
    const stats = {
        queueLength: OrderMatcher.orderQueue.length,
        assignedOrders: Object.keys(OrderMatcher.assignedOrders).length,
        availableDrivers: OrderMatcher.drivers.filter(d => d.status === 'available').length,
        busyDrivers: OrderMatcher.drivers.filter(d => d.status === 'busy').length,
        offlineDrivers: OrderMatcher.drivers.filter(d => d.status === 'offline').length,
        averageWaitTime: OrderMatcher.matchingStatus.metrics.avgWaitTime,
        matchingRate: calculateMatchingRate(),
        lastUpdate: new Date()
    };
    
    return stats;
}

/**
 * 计算订单匹配率
 * @returns {number} 匹配率(0-1)
 */
function calculateMatchingRate() {
    const metrics = OrderMatcher.matchingStatus.metrics;
    const total = metrics.totalMatched + metrics.totalRejected + OrderMatcher.orderQueue.length;
    
    if (total === 0) return 1;
    return metrics.totalMatched / total;
}

/**
 * 开始模拟司机位置更新
 * 注意：此函数仅用于模拟，实际应用中司机位置由GPS提供
 */
function startDriverSimulation() {
    if (!OrderMatcher.config.enableRealTimeUpdates) return;
    
    // 每隔几秒更新司机位置
    setInterval(() => {
        OrderMatcher.drivers.forEach(driver => {
            // 只更新在线司机
            if (driver.status === 'offline') return;
            
            // 有活跃订单的司机朝向订单位置移动
            if (driver.activeOrders.length > 0) {
                const firstOrder = driver.activeOrders[0];
                let targetPosition;
                
                // 根据订单状态确定目标位置
                const order = Object.values(OrderMatcher.assignedOrders).find(o => o.id === firstOrder.id);
                if (order && order.status === 'in-progress') {
                    // 已取货，向送货点移动
                    targetPosition = order.deliveryPosition;
                } else {
                    // 未取货，向取货点移动
                    targetPosition = order.pickupPosition || firstOrder.pickupPosition;
                }
                
                if (targetPosition) {
                    // 向目标移动
                    moveTowardsPosition(driver, targetPosition);
                }
            } else {
                // 空闲司机随机移动
                randomDriverMovement(driver);
            }
        });
    }, 3000);
}

/**
 * 司机位置向目标移动
 * @param {Object} driver - 司机对象
 * @param {Array} targetPosition - 目标位置
 */
function moveTowardsPosition(driver, targetPosition) {
    if (!driver.position || !targetPosition) return;
    
    // 计算方向
    const dx = targetPosition[0] - driver.position[0];
    const dy = targetPosition[1] - driver.position[1];
    
    // 计算距离
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 如果已经很接近目标，则认为到达
    if (distance < 0.0005) { // 约50米
        // 到达目标位置
        driver.position = [...targetPosition];
        return;
    }
    
    // 每次移动的距离(约50-200米)
    const moveDistance = 0.0005 + Math.random() * 0.0015;
    
    // 计算移动比例
    const moveFactor = moveDistance / distance;
    
    // 更新位置
    driver.position[0] += dx * moveFactor;
    driver.position[1] += dy * moveFactor;
    
    // 添加一些随机偏移，模拟真实路线
    driver.position[0] += (Math.random() - 0.5) * 0.0001;
    driver.position[1] += (Math.random() - 0.5) * 0.0001;
}

/**
 * 空闲司机随机移动
 * @param {Object} driver - 司机对象
 */
function randomDriverMovement(driver) {
    if (!driver.position) return;
    
    // 随机移动方向
    const angle = Math.random() * Math.PI * 2;
    
    // 移动距离(较小)
    const moveDistance = 0.0002 + Math.random() * 0.0008;
    
    // 更新位置
    driver.position[0] += Math.cos(angle) * moveDistance;
    driver.position[1] += Math.sin(angle) * moveDistance;
}

// 导出模块功能
window.OrderMatcher = {
    init: initOrderMatcher,
    addOrder: addOrderToQueue,
    cancelOrder: cancelOrder,
    completeOrder: completeOrder,
    updateDriverPosition: updateDriverPosition,
    updateDriverStatus: updateDriverStatus,
    getStatistics: getMatchingStatistics,
    startDriverSimulation: startDriverSimulation,
    
    // 仅开发使用
    getState: () => ({
        queueLength: OrderMatcher.orderQueue.length,
        driverCount: OrderMatcher.drivers.length,
        assignedCount: Object.keys(OrderMatcher.assignedOrders).length
    })
};

// 自动初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已经手动初始化
    if (OrderMatcher.drivers.length === 0) {
        initOrderMatcher();
    }
});
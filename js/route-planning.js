/**
 * 路径规划模拟模块
 * 负责计算路线、优化多点取送、考虑交通状况调整路线、计算预计到达时间
 */

// 模块作用域变量
const RoutePlanner = {
    // 模拟路网数据
    roadNetwork: null,
    // 模拟交通状况
    trafficConditions: {},
    // 缓存的路线
    cachedRoutes: {},
    // 配置参数
    config: {
        baseSpeed: 40, // 基础行驶速度(公里/小时)
        trafficUpdateInterval: 60000, // 交通状况更新间隔(毫秒)
        routeSimplification: 0.5, // 路线简化程度(0-1)
        maxCacheSize: 100 // 最大路线缓存数量
    }
};

/**
 * 初始化路径规划模块
 * @param {Object} options - 配置选项
 */
function initRoutePlanner(options = {}) {
    console.log("初始化路径规划模块...");
    
    // 合并配置
    if (options.config) {
        RoutePlanner.config = { ...RoutePlanner.config, ...options.config };
    }
    
    // 初始化模拟路网
    initRoadNetwork();
    
    // 初始化模拟交通状况
    initTrafficConditions();
    
    // 设置交通状况定期更新
    setInterval(updateTrafficConditions, RoutePlanner.config.trafficUpdateInterval);
    
    console.log("路径规划模块初始化完成");
}

/**
 * 初始化模拟路网
 */
function initRoadNetwork() {
    // 在实际应用中，这里会加载真实的路网数据
    // 这里使用模拟数据，创建一个简化的路网结构
    
    // 创建城市主要道路网格
    const gridSize = 20; // 网格大小
    const nodeDistance = 0.005; // 节点间经纬度距离(约500米)
    
    // 以北京为中心创建路网
    const centerLat = 39.9042;
    const centerLng = 116.4074;
    
    // 创建路网节点和边
    const nodes = [];
    const edges = [];
    
    // 生成节点网格
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const nodeId = `n_${i}_${j}`;
            const lat = centerLat - (gridSize/2 - i) * nodeDistance;
            const lng = centerLng - (gridSize/2 - j) * nodeDistance;
            
            nodes.push({
                id: nodeId,
                position: [lng, lat],
                connections: []
            });
            
            // 创建与相邻节点的连接(边)
            if (i > 0) {
                const edgeId = `e_${i}_${j}_h`;
                const sourceId = `n_${i-1}_${j}`;
                const targetId = nodeId;
                
                // 计算基础行驶时间(分钟)
                const distance = nodeDistance * 111.32; // 转换为公里(1度约等于111.32公里)
                const baseTime = (distance / RoutePlanner.config.baseSpeed) * 60;
                
                edges.push({
                    id: edgeId,
                    source: sourceId,
                    target: targetId,
                    distance: distance,
                    baseTime: baseTime,
                    roadType: getRoadType(i, j)
                });
            }
            
            if (j > 0) {
                const edgeId = `e_${i}_${j}_v`;
                const sourceId = `n_${i}_${j-1}`;
                const targetId = nodeId;
                
                // 计算基础行驶时间(分钟)
                const distance = nodeDistance * 111.32;
                const baseTime = (distance / RoutePlanner.config.baseSpeed) * 60;
                
                edges.push({
                    id: edgeId,
                    source: sourceId,
                    target: targetId,
                    distance: distance,
                    baseTime: baseTime,
                    roadType: getRoadType(i, j)
                });
            }
        }
    }
    
    // 建立节点之间的连接关系
    edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode) {
            sourceNode.connections.push({
                to: edge.target,
                edge: edge.id
            });
            
            // 双向道路
            targetNode.connections.push({
                to: edge.source,
                edge: edge.id
            });
        }
    });
    
    // 保存路网
    RoutePlanner.roadNetwork = {
        nodes: nodes,
        edges: edges
    };
    
    console.log(`路网初始化完成: ${nodes.length}个节点, ${edges.length}条边`);
}

/**
 * 根据位置确定道路类型
 * @param {number} i - 网格行索引
 * @param {number} j - 网格列索引
 * @returns {string} 道路类型
 */
function getRoadType(i, j) {
    // 模拟不同类型的道路
    // 主干道
    if (i % 5 === 0 || j % 5 === 0) {
        return 'main';
    }
    // 辅路
    else if (i % 3 === 0 || j % 3 === 0) {
        return 'secondary';
    }
    // 小路
    else {
        return 'local';
    }
}

/**
 * 初始化交通状况
 */
function initTrafficConditions() {
    if (!RoutePlanner.roadNetwork) return;
    
    // 初始化所有边的交通状况
    RoutePlanner.roadNetwork.edges.forEach(edge => {
        // 生成初始交通系数(0.8-2.0)，1.0为正常通行
        // 小于1表示通畅，大于1表示拥堵
        let trafficCoefficient;
        
        // 根据道路类型设置默认交通状况
        switch (edge.roadType) {
            case 'main':
                // 主干道初始稍拥堵
                trafficCoefficient = 0.9 + Math.random() * 0.5;
                break;
            case 'secondary':
                // 次干道一般通畅
                trafficCoefficient = 0.8 + Math.random() * 0.4;
                break;
            case 'local':
                // 小路变化较大
                trafficCoefficient = 0.7 + Math.random() * 0.7;
                break;
            default:
                trafficCoefficient = 1.0;
        }
        
        RoutePlanner.trafficConditions[edge.id] = {
            coefficient: trafficCoefficient,
            updatedAt: new Date()
        };
    });
    
    console.log("交通状况初始化完成");
}

/**
 * 更新模拟交通状况
 */
function updateTrafficConditions() {
    if (!RoutePlanner.roadNetwork) return;
    
    // 获取当前时间
    const now = new Date();
    const hour = now.getHours();
    
    // 模拟早晚高峰交通状况
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    
    // 更新所有边的交通状况
    RoutePlanner.roadNetwork.edges.forEach(edge => {
        const currentTraffic = RoutePlanner.trafficConditions[edge.id];
        if (!currentTraffic) return;
        
        // 生成交通变化量(-0.2到0.2)
        let trafficChange = (Math.random() * 0.4) - 0.2;
        
        // 在高峰期，主干道更容易拥堵
        if (isPeakHour && edge.roadType === 'main') {
            trafficChange += 0.3;
        }
        
        // 应用变化，但保持在合理范围内
        let newCoefficient = currentTraffic.coefficient + trafficChange;
        
        // 保持在合理范围内
        newCoefficient = Math.max(0.6, Math.min(newCoefficient, 3.0));
        
        // 更新交通状况
        RoutePlanner.trafficConditions[edge.id] = {
            coefficient: newCoefficient,
            updatedAt: now
        };
    });
    
    // 清理路线缓存（交通状况已变化）
    RoutePlanner.cachedRoutes = {};
    
    // 发布交通更新事件
    if (typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('trafficupdate', {
            detail: {
                timestamp: now,
                isPeakHour: isPeakHour
            }
        }));
    }
    
    console.log(`交通状况已更新, 当前${isPeakHour ? '高峰期' : '平峰期'}`);
}

/**
 * 规划两点间路径
 * @param {Array} startPosition - 起点位置 [经度, 纬度]
 * @param {Array} endPosition - 终点位置 [经度, 纬度]
 * @param {Object} options - 规划选项
 * @returns {Promise<Object>} 规划结果
 */
function planRoute(startPosition, endPosition, options = {}) {
    return new Promise((resolve, reject) => {
        if (!startPosition || !endPosition || !Array.isArray(startPosition) || !Array.isArray(endPosition)) {
            reject(new Error('起点或终点坐标无效'));
            return;
        }
        
        // 检查缓存
        const cacheKey = `${startPosition.join(',')}_${endPosition.join(',')}_${JSON.stringify(options)}`;
        if (RoutePlanner.cachedRoutes[cacheKey]) {
            resolve(RoutePlanner.cachedRoutes[cacheKey]);
            return;
        }
        
        // 在实际应用中，这里会调用地图API的路线规划
        // 模拟路线规划过程
        setTimeout(() => {
            try {
                // 找到最近的路网节点
                const startNode = findNearestNode(startPosition);
                const endNode = findNearestNode(endPosition);
                
                if (!startNode || !endNode) {
                    reject(new Error('无法找到最近的路网节点'));
                    return;
                }
                
                // 使用A*算法规划路径
                const result = findPath(startNode.id, endNode.id, options);
                
                // 生成详细路线
                const route = generateDetailedRoute(result.path, startPosition, endPosition, options);
                
                // 缓存结果
                if (Object.keys(RoutePlanner.cachedRoutes).length > RoutePlanner.config.maxCacheSize) {
                    // 清理缓存
                    RoutePlanner.cachedRoutes = {};
                }
                RoutePlanner.cachedRoutes[cacheKey] = route;
                
                resolve(route);
            } catch (error) {
                console.error("路径规划错误:", error);
                reject(error);
            }
        }, 200); // 模拟API调用延迟
    });
}

/**
 * 找到最近的路网节点
 * @param {Array} position - 位置 [经度, 纬度]
 * @returns {Object|null} 最近的节点
 */
function findNearestNode(position) {
    if (!RoutePlanner.roadNetwork || !RoutePlanner.roadNetwork.nodes.length) return null;
    
    let nearestNode = null;
    let minDistance = Number.MAX_VALUE;
    
    for (const node of RoutePlanner.roadNetwork.nodes) {
        const distance = calculateDistance(position, node.position);
        if (distance < minDistance) {
            minDistance = distance;
            nearestNode = node;
        }
    }
    
    return nearestNode;
}

/**
 * 计算两个位置之间的距离
 * @param {Array} pos1 - 位置1 [经度, 纬度]
 * @param {Array} pos2 - 位置2 [经度, 纬度]
 * @returns {number} 距离(公里)
 */
function calculateDistance(pos1, pos2) {
    if (!pos1 || !pos2 || !Array.isArray(pos1) || !Array.isArray(pos2)) return 0;
    
    // 使用球面距离计算公式（简化版）
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
 * 路径查找算法(A*算法)
 * @param {string} startNodeId - 起始节点ID
 * @param {string} endNodeId - 终止节点ID
 * @param {Object} options - 选项
 * @returns {Object} 路径结果
 */
function findPath(startNodeId, endNodeId, options = {}) {
    const nodes = RoutePlanner.roadNetwork.nodes;
    const edges = RoutePlanner.roadNetwork.edges;
    
    // 获取节点索引
    const nodesMap = {};
    nodes.forEach(node => {
        nodesMap[node.id] = node;
    });
    
    // A*算法数据结构
    const openSet = new Set();
    openSet.add(startNodeId);
    
    const cameFrom = {};
    const edgeUsed = {};
    
    const gScore = {};
    gScore[startNodeId] = 0;
    
    const fScore = {};
    fScore[startNodeId] = heuristicCost(startNodeId, endNodeId, nodesMap);
    
    while (openSet.size > 0) {
        // 找到openSet中fScore最小的节点
        let current = null;
        let lowestFScore = Number.MAX_VALUE;
        
        for (const nodeId of openSet) {
            if (fScore[nodeId] < lowestFScore) {
                lowestFScore = fScore[nodeId];
                current = nodeId;
            }
        }
        
        // 如果已到达终点
        if (current === endNodeId) {
            // 重建路径
            const path = [];
            let currentNode = current;
            
            while (currentNode !== startNodeId) {
                path.unshift({
                    node: currentNode,
                    edge: edgeUsed[currentNode]
                });
                currentNode = cameFrom[currentNode];
            }
            
            // 计算总距离和时间
            let totalDistance = 0;
            let totalTime = 0;
            
            path.forEach(step => {
                const edge = edges.find(e => e.id === step.edge);
                if (edge) {
                    totalDistance += edge.distance;
                    
                    // 根据交通状况调整时间
                    const trafficCondition = RoutePlanner.trafficConditions[edge.id];
                    const timeMultiplier = trafficCondition ? trafficCondition.coefficient : 1;
                    totalTime += edge.baseTime * timeMultiplier;
                }
            });
            
            return {
                path,
                distance: totalDistance,
                estimatedTime: totalTime,
                nodeCount: path.length
            };
        }
        
        // 从openSet中移除当前节点
        openSet.delete(current);
        
        // 检查所有相邻节点
        const currentNode = nodesMap[current];
        for (const connection of currentNode.connections) {
            const neighbor = connection.to;
            const edge = edges.find(e => e.id === connection.edge);
            
            if (!edge) continue;
            
            // 根据交通状况调整时间
            const trafficCondition = RoutePlanner.trafficConditions[edge.id];
            const timeMultiplier = trafficCondition ? trafficCondition.coefficient : 1;
            const moveTime = edge.baseTime * timeMultiplier;
            
            // 考虑偏好选项
            let timeWeight = 1;
            if (options.avoidCongestion) {
                // 在拥堵地区增加权重
                timeWeight = Math.pow(timeMultiplier, 2);
            }
            
            // 该邻居的g值是通过当前节点到达该邻居的成本
            const tentativeGScore = gScore[current] + (moveTime * timeWeight);
            
            // 如果找到了更好的路径
            if (!(neighbor in gScore) || tentativeGScore < gScore[neighbor]) {
                cameFrom[neighbor] = current;
                edgeUsed[neighbor] = connection.edge;
                gScore[neighbor] = tentativeGScore;
                fScore[neighbor] = gScore[neighbor] + heuristicCost(neighbor, endNodeId, nodesMap);
                
                if (!openSet.has(neighbor)) {
                    openSet.add(neighbor);
                }
            }
        }
    }
    
    // 如果到这里还没返回，说明没有找到路径
    return {
        path: [],
        distance: 0,
        estimatedTime: 0,
        nodeCount: 0
    };
}

/**
 * A*算法的启发式函数
 * @param {string} startId - 起始节点ID
 * @param {string} endId - 终止节点ID
 * @param {Object} nodesMap - 节点映射
 * @returns {number} 启发式成本
 */
function heuristicCost(startId, endId, nodesMap) {
    const startNode = nodesMap[startId];
    const endNode = nodesMap[endId];
    
    if (!startNode || !endNode) return 0;
    
    // 使用直线距离作为启发式
    const distance = calculateDistance(startNode.position, endNode.position);
    
    // 估计时间(以分钟计)
    return (distance / RoutePlanner.config.baseSpeed) * 60;
}

/**
 * 生成详细路线
 * @param {Array} path - 路径节点
 * @param {Array} startPosition - 起始位置
 * @param {Array} endPosition - 结束位置
 * @param {Object} options - 选项
 * @returns {Object} 详细路线
 */
function generateDetailedRoute(path, startPosition, endPosition, options) {
    const nodes = RoutePlanner.roadNetwork.nodes;
    const edges = RoutePlanner.roadNetwork.edges;
    
    // 路线段数组
    const segments = [];
    
    // 路线点数组
    let points = [startPosition];
    
    // 总距离和时间
    let totalDistance = 0;
    let totalTime = 0;
    
    // 添加路径各段
    path.forEach((step, index) => {
        const edge = edges.find(e => e.id === step.edge);
        if (!edge) return;
        
        const fromNode = nodes.find(n => n.id === (index === 0 ? edge.source : cameFrom[step.node]));
        const toNode = nodes.find(n => n.id === step.node);
        
        if (!fromNode || !toNode) return;
        
        // 添加节点位置
        points.push(toNode.position);
        
        // 计算该段距离
        const distance = edge.distance;
        totalDistance += distance;
        
        // 根据交通状况计算时间
        const trafficCondition = RoutePlanner.trafficConditions[edge.id];
        const trafficCoefficient = trafficCondition ? trafficCondition.coefficient : 1;
        const segmentTime = edge.baseTime * trafficCoefficient;
        totalTime += segmentTime;
        
        // 生成路段描述
        let description = '';
        if (edge.roadType === 'main') {
            description = `沿主干道行驶 ${(distance * 1000).toFixed(0)}米`;
        } else if (edge.roadType === 'secondary') {
            description = `沿次干道行驶 ${(distance * 1000).toFixed(0)}米`;
        } else {
            description = `沿道路行驶 ${(distance * 1000).toFixed(0)}米`;
        }
        
        // 添加路段
        segments.push({
            from: fromNode.position,
            to: toNode.position,
            distance: distance,
            time: segmentTime,
            trafficCondition: getTrafficConditionText(trafficCoefficient),
            description
        });
    });
    
    // 添加终点
    points.push(endPosition);
    
    // 简化路线点(根据配置)
    if (RoutePlanner.config.routeSimplification > 0) {
        points = simplifyRoute(points, RoutePlanner.config.routeSimplification);
    }
    
    // 生成总路线描述
    const routeDescription = {
        summary: `全程约${totalDistance.toFixed(1)}公里，预计需要${Math.ceil(totalTime)}分钟`,
        distance: totalDistance,
        time: totalTime,
        segments: segments
    };
    
    // 路线对象
    return {
        points,
        description: routeDescription,
        distance: totalDistance,
        duration: totalTime * 60, // 转换为秒
        traffic: {
            averageCoefficient: segments.length ? 
                segments.reduce((sum, segment) => sum + 
                    RoutePlanner.trafficConditions[segment.edge]?.coefficient || 1, 0
                ) / segments.length : 1
        }
    };
}

/**
 * 简化路线点
 * @param {Array} points - 路线点数组
 * @param {number} tolerance - 简化容差
 * @returns {Array} 简化后的点数组
 */
function simplifyRoute(points, tolerance) {
    if (!points || points.length <= 2) return points;
    
    // 使用Douglas-Peucker算法简化路线
    // 这里使用一个简化版本
    const result = [points[0]];
    const stack = [[0, points.length - 1]];
    
    while (stack.length > 0) {
        const [start, end] = stack.pop();
        
        // 如果只有两个点，则继续
        if (start + 1 === end) {
            result.push(points[end]);
            continue;
        }
        
        // 找到最大偏差点
        let maxDist = 0;
        let maxIndex = 0;
        
        for (let i = start + 1; i < end; i++) {
            const dist = perpendicularDistance(points[i], points[start], points[end]);
            if (dist > maxDist) {
                maxDist = dist;
                maxIndex = i;
            }
        }
        
        // 如果最大偏差大于阈值，则分割线段
        if (maxDist > tolerance) {
            stack.push([maxIndex, end]);
            stack.push([start, maxIndex]);
        } else {
            result.push(points[end]);
        }
    }
    
    return result;
}

/**
 * 计算点到线的垂直距离
 * @param {Array} point - 点坐标
 * @param {Array} lineStart - 线起点
 * @param {Array} lineEnd - 线终点
 * @returns {number} 垂直距离
 */
function perpendicularDistance(point, lineStart, lineEnd) {
    const [x, y] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;
    
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    const param = len_sq !== 0 ? dot / len_sq : -1;
    
    let xx, yy;
    
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    
    const dx = x - xx;
    const dy = y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 获取交通状况文本描述
 * @param {number} coefficient - 交通系数
 * @returns {string} 文本描述
 */
function getTrafficConditionText(coefficient) {
    if (coefficient < 0.8) return '畅通';
    if (coefficient < 1.2) return '正常';
    if (coefficient < 1.8) return '拥堵';
    return '严重拥堵';
}

/**
 * 规划多点取送路径
 * @param {Array} positions - 位置数组，第一个为起点，最后一个为终点
 * @param {Object} options - 规划选项
 * @returns {Promise<Object>} 规划结果
 */
function planMultiPointRoute(positions, options = {}) {
    return new Promise(async (resolve, reject) => {
        if (!positions || !Array.isArray(positions) || positions.length < 2) {
            reject(new Error('位置参数无效'));
            return;
        }
        
        try {
            // 如果只有起点和终点
            if (positions.length === 2) {
                const result = await planRoute(positions[0], positions[1], options);
                resolve(result);
                return;
            }
            
            // 有多个途经点，先确定最佳顺序
            const optimizedOrder = await optimizeWaypoints(positions[0], positions[positions.length - 1], 
                positions.slice(1, positions.length - 1), options);
            
            // 分段规划路径并合并结果
            const segments = [];
            const combinedPoints = [positions[0]]; // 起始点
            let totalDistance = 0;
            let totalDuration = 0;
            
            // 按最优顺序连接各点
            for (let i = 0; i < optimizedOrder.order.length; i++) {
                const currentPos = i === 0 ? positions[0] : positions[optimizedOrder.order[i-1]];
                const nextPos = positions[optimizedOrder.order[i]];
                
                const segmentRoute = await planRoute(currentPos, nextPos, options);
                
                // 合并路径点（去除重复的连接点）
                if (segmentRoute.points.length > 1) {
                    combinedPoints.push(...segmentRoute.points.slice(1));
                }
                
                segments.push({
                    from: currentPos,
                    to: nextPos,
                    route: segmentRoute
                });
                
                totalDistance += segmentRoute.distance;
                totalDuration += segmentRoute.duration;
            }
            
            // 创建合并后的路线结果
            const combinedResult = {
                points: combinedPoints,
                segments: segments,
                waypoints: optimizedOrder.order.map(i => positions[i]),
                distance: totalDistance,
                duration: totalDuration,
                optimizedOrder: optimizedOrder.order
            };
            
            resolve(combinedResult);
            
        } catch (error) {
            console.error("多点路径规划错误:", error);
            reject(error);
        }
    });
}

/**
 * 优化途经点顺序
 * @param {Array} start - 起始点
 * @param {Array} end - 终点
 * @param {Array} waypoints - 途经点
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 优化结果
 */
function optimizeWaypoints(start, end, waypoints, options = {}) {
    return new Promise((resolve) => {
        // 在实际应用中，这里会使用更复杂的TSP算法
        // 这里使用简化版的最近邻点算法
        
        // 建立距离矩阵
        const allPoints = [start, ...waypoints, end];
        const n = allPoints.length;
        const distMatrix = Array(n).fill().map(() => Array(n).fill(0));
        
        // 计算所有点之间的距离
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                distMatrix[i][j] = calculateDistance(allPoints[i], allPoints[j]);
            }
        }
        
        // 最近邻点算法
        const visited = Array(n).fill(false);
        visited[0] = true;  // 起点
        visited[n-1] = true; // 终点
        
        const order = [0]; // 从起点开始
        let current = 0;
        
        // 按照最短距离依次访问所有点
        for (let i = 0; i < waypoints.length; i++) {
            let minDist = Number.MAX_VALUE;
            let nextPoint = -1;
            
            // 找到最近的未访问点
            for (let j = 1; j < n - 1; j++) {
                if (!visited[j] && distMatrix[current][j] < minDist) {
                    minDist = distMatrix[current][j];
                    nextPoint = j;
                }
            }
            
            if (nextPoint !== -1) {
                visited[nextPoint] = true;
                order.push(nextPoint);
                current = nextPoint;
            }
        }
        
        order.push(n - 1); // 添加终点
        
        // 计算总距离
        let totalDistance = 0;
        for (let i = 0; i < order.length - 1; i++) {
            totalDistance += distMatrix[order[i]][order[i+1]];
        }
        
        resolve({
            order: order.slice(1, order.length - 1), // 去掉起点和终点，只保留途经点的顺序
            distance: totalDistance
        });
    });
}

/**
 * 更新路线显示
 * @param {Object} mapInstance - 地图实例 
 * @param {Array} points - 路线点数组
 * @param {Object} options - 显示选项
 */
function displayRoute(mapInstance, points, options = {}) {
    if (!mapInstance || !points || !Array.isArray(points)) return;
    
    // 默认样式
    const defaultOptions = {
        strokeColor: '#3370FF',
        strokeWeight: 6,
        strokeOpacity: 0.8,
        showDirectionArrows: true
    };
    
    // 合并选项
    const displayOptions = {...defaultOptions, ...options};
    
    // 如果地图模块提供了绘制路线的函数，则调用它
    if (window.MapUtils && typeof window.MapUtils.drawRoute === 'function') {
        window.MapUtils.drawRoute(mapInstance, points, displayOptions);
    } else {
        // 默认绘制实现
        console.log("使用默认路线绘制方法");
        
        // 创建折线对象
        if (typeof AMap !== 'undefined' && mapInstance) {
            // 清除可能存在的旧路线
            if (mapInstance._routeOverlay) {
                mapInstance.remove(mapInstance._routeOverlay);
            }
            
            // 创建新路线
            const polyline = new AMap.Polyline({
                path: points,
                strokeColor: displayOptions.strokeColor,
                strokeWeight: displayOptions.strokeWeight,
                strokeOpacity: displayOptions.strokeOpacity,
                showDir: displayOptions.showDirectionArrows
            });
            
            // 添加到地图
            mapInstance.add(polyline);
            mapInstance._routeOverlay = polyline;
            
            // 调整视野以包含整个路线
            mapInstance.setFitView([polyline]);
        }
    }
}

/**
 * 根据交通状况动态调整路线
 * @param {Array} routePoints - 当前路线点
 * @param {Array} currentPos - 当前位置
 * @param {Array} destination - 目的地
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 调整后的路线
 */
function adjustRouteForTraffic(routePoints, currentPos, destination, options = {}) {
    return new Promise(async (resolve, reject) => {
        try {
            // 检查是否需要重新规划
            const needReplanning = checkTrafficConditionChange(routePoints);
            
            if (needReplanning) {
                console.log("检测到显著交通变化，重新规划路线");
                
                // 设置避开拥堵选项
                const routeOptions = {
                    ...options,
                    avoidCongestion: true
                };
                
                // 重新规划从当前位置到目的地的路线
                const newRoute = await planRoute(currentPos, destination, routeOptions);
                
                resolve({
                    rerouted: true,
                    route: newRoute,
                    reason: '交通状况变化'
                });
            } else {
                // 无需重新规划
                resolve({
                    rerouted: false,
                    route: { points: routePoints },
                    reason: '交通状况稳定'
                });
            }
        } catch (error) {
            console.error("调整路线错误:", error);
            reject(error);
        }
    });
}

/**
 * 检查路线上的交通状况是否有显著变化
 * @param {Array} routePoints - 路线点
 * @returns {boolean} 是否需要重新规划
 */
function checkTrafficConditionChange(routePoints) {
    // 在真实系统中，这里会检查路线上节点的实际交通状况变化
    // 这里使用简化逻辑，随机决定是否需要重规划（为了演示）
    
    // 获取现有交通拥堵段数量
    let congestedSegments = 0;
    let totalSegments = 0;
    
    for (const edgeId in RoutePlanner.trafficConditions) {
        totalSegments++;
        if (RoutePlanner.trafficConditions[edgeId].coefficient > 1.5) {
            congestedSegments++;
        }
    }
    
    // 拥堵比率
    const congestionRatio = congestedSegments / totalSegments;
    
    // 如果拥堵比率高，增加重规划概率
    const rerouteProbability = Math.min(0.2, congestionRatio * 0.5);
    
    // 随机决定是否重规划
    return Math.random() < rerouteProbability;
}

/**
 * 估算到达时间
 * @param {Array} routePoints - 路线点
 * @param {number} averageSpeed - 平均速度(km/h)
 * @returns {Object} 估算结果
 */
function estimateArrivalTime(routePoints, averageSpeed = 30) {
    if (!routePoints || routePoints.length < 2) {
        return {
            distance: 0,
            duration: 0,
            arrivalTime: new Date()
        };
    }
    
    // 计算路线总长度
    let totalDistance = 0;
    for (let i = 0; i < routePoints.length - 1; i++) {
        totalDistance += calculateDistance(routePoints[i], routePoints[i + 1]);
    }
    
    // 根据平均速度计算时间（小时）
    const hours = totalDistance / averageSpeed;
    
    // 转换为秒
    const durationSeconds = hours * 3600;
    
    // 计算预计到达时间
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + durationSeconds * 1000);
    
    return {
        distance: totalDistance,
        duration: durationSeconds,
        arrivalTime: arrivalTime
    };
}

// 导出模块功能
window.RoutePlanner = {
    init: initRoutePlanner,
    planRoute: planRoute,
    planMultiPointRoute: planMultiPointRoute,
    displayRoute: displayRoute,
    adjustRouteForTraffic: adjustRouteForTraffic,
    estimateArrivalTime: estimateArrivalTime,
    getTrafficCondition: (edgeId) => RoutePlanner.trafficConditions[edgeId]
};

// 自动初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已经手动初始化
    if (!RoutePlanner.roadNetwork) {
        initRoutePlanner();
    }
});
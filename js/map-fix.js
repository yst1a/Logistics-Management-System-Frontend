/**
 * 智送系统 - 地图修复脚本（极简版）
 * 仅处理地图初始化，不干扰导航功能
 */

// 全局地图实例存储
window.mapInstances = window.mapInstances || {};

// 当页面加载完成时初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('地图修复脚本启动');
    
    // 初始化当前可见界面的地图
    // 使用setTimeout确保其他脚本先执行完毕
    setTimeout(function() {
        initMapForCurrentInterface();
    }, 300);
    
    // 监听导航切换事件
    document.addEventListener('mapNeedsInit', function(e) {
        if (e.detail && e.detail.interfaceId) {
            console.log(`收到地图初始化请求: ${e.detail.interfaceId}`);
            setTimeout(function() {
                initMapForInterface(e.detail.interfaceId);
            }, 100);
        }
    });
});

// 初始化当前可见界面的地图
function initMapForCurrentInterface() {
    const visibleInterface = document.querySelector('.interface:not(.hidden)') || 
                             document.querySelector('.interface.active');
    
    if (visibleInterface) {
        const interfaceId = visibleInterface.id.split('-')[0]; // 例如 'user-interface' -> 'user'
        initMapForInterface(interfaceId);
    } else {
        // 默认初始化用户地图
        initMapForInterface('user');
    }
}

// 为特定界面初始化地图
function initMapForInterface(interfaceId) {
    const mapId = `${interfaceId}-map`;
    const mapContainer = document.getElementById(mapId);
    
    if (!mapContainer) {
        console.warn(`找不到地图容器: ${mapId}`);
        return;
    }
    
    // 确保地图容器可见并有高度
    mapContainer.style.width = '100%';
    mapContainer.style.height = '100%';
    mapContainer.style.display = 'block';
    
    // 如果已有地图实例，调整大小
    if (window.mapInstances[mapId]) {
        console.log(`调整地图大小: ${mapId}`);
        window.mapInstances[mapId].resize();
        return;
    }
    
    // 创建新地图实例
    try {
        console.log(`创建新地图: ${mapId}`);
        
        const map = new AMap.Map(mapId, {
            zoom: 13,
            center: [118.6743, 37.4340], // 东营市中心
            resizeEnable: true
        });
        
        // 存储地图实例
        window.mapInstances[mapId] = map;
        
        // 添加一些标记点作为示例
        addSampleMarkers(map, interfaceId);
        
        console.log(`地图 ${mapId} 初始化成功!`);
    } catch (error) {
        console.error(`地图初始化失败: ${error.message}`);
    }
}

// 添加示例标记
function addSampleMarkers(map, type) {
    // 根据界面类型添加不同标记
    const center = map.getCenter();
    
    // 添加示例标记
    if (type === 'user') {
        // 用户界面添加3个车辆标记
        for (let i = 0; i < 3; i++) {
            new AMap.Marker({
                map: map,
                position: [
                    center.lng + (Math.random() - 0.5) * 0.05,
                    center.lat + (Math.random() - 0.5) * 0.05
                ],
                title: `车辆 ${i+1}`
            });
        }
    } else if (type === 'driver') {
        // 司机界面添加当前位置
        new AMap.Marker({
            map: map,
            position: center,
            title: '当前位置'
        });
    }
}
/**
 * 智送系统 - 导航修复脚本
 * 修复顶部导航切换功能
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('导航修复脚本已加载');
    fixNavigation();
});

// 修复导航切换功能
function fixNavigation() {
    // 获取所有导航链接
    const navLinks = document.querySelectorAll('.main-nav a');
    
    // 为每个导航链接重新绑定点击事件
    navLinks.forEach(link => {
        // 移除可能存在的旧事件监听器（通过克隆元素）
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
        
        // 添加新的点击事件处理
        newLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 1. 更新导航激活状态 - 重要修复：移除所有active类和after伪元素样式
            navLinks.forEach(item => {
                item.classList.remove('active');
                // 移除可能残留的底部蓝色横条样式
                item.style.position = 'relative';
                item.style.borderBottom = 'none';
            });
            this.classList.add('active');
            
            // 2. 获取目标界面ID (例如 'nav-user' -> 'user')
            const targetId = this.id.split('-')[1];
            
            // 3. 隐藏所有界面
            const interfaces = document.querySelectorAll('.interface');
            interfaces.forEach(interface => {
                interface.classList.add('hidden');
            });
            
            // 4. 显示目标界面
            const targetInterface = document.getElementById(`${targetId}-interface`);
            if (targetInterface) {
                targetInterface.classList.remove('hidden');
                
                // 5. 如果存在地图，强制更新地图大小
                const mapContainer = document.getElementById(`${targetId}-map`);
                if (mapContainer && window.mapInstances && window.mapInstances[`${targetId}-map`]) {
                    setTimeout(() => {
                        window.mapInstances[`${targetId}-map`].resize();
                    }, 100);
                }
            }
            
            console.log(`已切换到${targetId}界面`);
            
            // 6. 触发地图初始化事件（供map-fix.js使用）
            const mapInitEvent = new CustomEvent('mapNeedsInit', {
                detail: { interfaceId: targetId }
            });
            document.dispatchEvent(mapInitEvent);
        });
    });
    
    console.log('导航功能已修复');
}
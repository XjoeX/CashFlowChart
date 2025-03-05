// 在页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
    console.log('应用程序初始化中...');
    
    // 获取DOM元素
    const addNodeBtn = document.getElementById('add-node-btn');
    const addEdgeBtn = document.getElementById('add-edge-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const canvasContainer = document.getElementById('canvas-container');
    const nodePropertiesPanel = document.getElementById('node-properties');
    const edgePropertiesPanel = document.getElementById('edge-properties');
    const nodeName = document.getElementById('node-name');
    const nodeBalance = document.getElementById('node-balance');
    const edgeAmount = document.getElementById('edge-amount');
    const edgeDescription = document.getElementById('edge-description');
    const saveNodeBtn = document.getElementById('save-node-btn');
    const saveEdgeBtn = document.getElementById('save-edge-btn');
    const summaryContent = document.getElementById('summary-content');
    
    // 获取数据管理按钮
    const saveDataBtn = document.getElementById('save-data-btn');
    const loadDataBtn = document.getElementById('load-data-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');
    const exportDataBtn = document.getElementById('export-data-btn');
    const importDataBtn = document.getElementById('import-data-btn');
    const importFile = document.getElementById('import-file');
    
    // 应用状态
    const state = {
        nodes: [],
        edges: [],
        nextNodeId: 1,
        nextEdgeId: 1,
        selectedNode: null,
        selectedEdge: null,
        mode: 'default', // 'default', 'add-node', 'add-edge', 'pan'
        sourceNodeForEdge: null,
        // 画布拖动相关状态
        isPanning: false,
        startPanX: 0,
        startPanY: 0,
        canvasOffsetX: 0,
        canvasOffsetY: 0
    };
    
    // 初始化应用
    function init() {
        // 尝试从本地存储加载数据
        loadFromLocalStorage();
        
        // 添加画布拖动功能
        setupCanvasPanning();
        
        // 绑定事件
        addNodeBtn.addEventListener('click', function() {
            console.log('添加节点按钮被点击');
            setMode('add-node');
        });
        
        addEdgeBtn.addEventListener('click', function() {
            console.log('添加连接按钮被点击');
            setMode('add-edge');
        });
        
        deleteBtn.addEventListener('click', function() {
            console.log('删除按钮被点击');
            deleteSelected();
        });
        
        saveNodeBtn.addEventListener('click', function() {
            console.log('保存节点按钮被点击');
            saveNodeProperties();
        });
        
        saveEdgeBtn.addEventListener('click', function() {
            console.log('保存连接按钮被点击');
            saveEdgeProperties();
        });
        
        canvasContainer.addEventListener('click', function(e) {
            // 如果正在拖动画布，不处理点击事件
            if (state.isPanning) return;
            
            console.log('画布被点击', e.clientX, e.clientY);
            handleCanvasClick(e);
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                console.log('ESC键被按下');
                cancelCurrentOperation();
            } else if (e.key === 'Delete') {
                console.log('Delete键被按下');
                deleteSelected();
            } else if (e.key === ' ') {
                // 空格键切换到画布拖动模式
                if (state.mode !== 'pan') {
                    console.log('切换到画布拖动模式');
                    setMode('pan');
                }
            }
        });
        
        document.addEventListener('keyup', function(e) {
            if (e.key === ' ' && state.mode === 'pan') {
                // 空格键释放，返回到默认模式
                console.log('返回到默认模式');
                setMode('default');
            }
        });
        
        // 绑定数据管理按钮事件
        saveDataBtn.addEventListener('click', function() {
            console.log('保存数据按钮被点击');
            saveToLocalStorage();
            alert('数据已保存到浏览器缓存');
        });
        
        loadDataBtn.addEventListener('click', function() {
            console.log('加载数据按钮被点击');
            loadFromLocalStorage();
            alert('数据已从浏览器缓存加载');
        });
        
        clearDataBtn.addEventListener('click', function() {
            console.log('清空数据按钮被点击');
            if (confirm('确定要清空所有数据吗？此操作不可撤销。')) {
                clearAllData();
            }
        });
        
        exportDataBtn.addEventListener('click', function() {
            console.log('导出数据按钮被点击');
            exportData();
        });
        
        importDataBtn.addEventListener('click', function() {
            console.log('导入数据按钮被点击');
            importFile.click();
        });
        
        importFile.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                importData(file);
            }
        });
        
        // 初始化汇总信息
        updateSummary();
        
        console.log('应用程序初始化完成');
    }
    
    // 设置画布拖动功能
    function setupCanvasPanning() {
        // 鼠标按下事件
        canvasContainer.addEventListener('mousedown', function(e) {
            // 只有在以下情况下才启动拖动：
            // 1. 当前模式是 'pan'
            // 2. 点击的是画布本身，而不是其中的节点或连接
            if ((state.mode === 'pan' || e.button === 1) && e.target === canvasContainer) {
                state.isPanning = true;
                state.startPanX = e.clientX;
                state.startPanY = e.clientY;
                canvasContainer.style.cursor = 'grabbing';
                e.preventDefault(); // 防止选择文本等默认行为
            }
        });
        
        // 鼠标移动事件
        document.addEventListener('mousemove', function(e) {
            if (state.isPanning) {
                const dx = e.clientX - state.startPanX;
                const dy = e.clientY - state.startPanY;
                
                // 更新画布内容的位置
                updateCanvasPosition(dx, dy);
                
                // 更新起始点，为下一次移动做准备
                state.startPanX = e.clientX;
                state.startPanY = e.clientY;
            }
        });
        
        // 鼠标释放事件
        document.addEventListener('mouseup', function(e) {
            if (state.isPanning) {
                state.isPanning = false;
                canvasContainer.style.cursor = state.mode === 'pan' ? 'grab' : '';
            }
        });
        
        // 鼠标离开窗口事件
        document.addEventListener('mouseleave', function() {
            if (state.isPanning) {
                state.isPanning = false;
                canvasContainer.style.cursor = state.mode === 'pan' ? 'grab' : '';
            }
        });
        
        // 防止右键菜单干扰拖动
        canvasContainer.addEventListener('contextmenu', function(e) {
            if (state.mode === 'pan') {
                e.preventDefault();
            }
        });
        
        // 鼠标滚轮事件，可以用于缩放（未实现）
        canvasContainer.addEventListener('wheel', function(e) {
            // 这里可以添加缩放功能
            e.preventDefault();
        });
    }
    
    // 更新画布位置
    function updateCanvasPosition(dx, dy) {
        // 更新总偏移量
        state.canvasOffsetX += dx;
        state.canvasOffsetY += dy;
        
        // 获取所有节点和连接
        const nodes = document.querySelectorAll('.flowchart-node');
        const edges = document.querySelectorAll('.flowchart-edge');
        
        // 移动所有节点
        nodes.forEach(node => {
            const currentLeft = parseInt(node.style.left) || 0;
            const currentTop = parseInt(node.style.top) || 0;
            node.style.left = (currentLeft + dx) + 'px';
            node.style.top = (currentTop + dy) + 'px';
        });
        
        // 更新所有连接的位置
        updateEdges();
        
        console.log('画布位置更新:', state.canvasOffsetX, state.canvasOffsetY);
    }
    
    // 设置操作模式
    function setMode(mode) {
        console.log('设置模式:', mode);
        
        state.mode = mode;
        
        // 重置按钮状态
        addNodeBtn.classList.remove('active');
        addEdgeBtn.classList.remove('active');
        
        // 重置操作提示
        const operationHint = document.getElementById('operation-hint');
        
        // 根据模式设置按钮状态和操作提示
        switch (mode) {
            case 'add-node':
                addNodeBtn.classList.add('active');
                operationHint.textContent = '点击画布添加节点';
                break;
            case 'add-edge':
                addEdgeBtn.classList.add('active');
                operationHint.textContent = '请选择源节点';
                state.sourceNodeForEdge = null;
                break;
            case 'pan':
                canvasContainer.classList.add('panning');
                operationHint.textContent = '按住鼠标拖动画布';
                break;
            default:
                canvasContainer.classList.remove('panning');
                operationHint.textContent = '';
                break;
        }
    }
    
    // 处理画布点击
    function handleCanvasClick(e) {
        const rect = canvasContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        console.log('画布点击位置:', x, y);
        
        if (state.mode === 'add-node') {
            // 添加节点模式
            const node = createNode(x, y);
            setMode('default');
        } else if (state.mode === 'add-edge') {
            // 添加连接模式
            const clickedNode = findNodeAtPosition(x, y);
            
            if (clickedNode) {
                if (!state.sourceNodeForEdge) {
                    // 选择源节点
                    state.sourceNodeForEdge = clickedNode;
                    document.getElementById(`node-${clickedNode.id}`).classList.add('selected');
                    document.getElementById('operation-hint').textContent = '请选择目标节点';
                } else if (state.sourceNodeForEdge.id !== clickedNode.id) {
                    // 选择目标节点并创建连接
                    createEdge(state.sourceNodeForEdge, clickedNode);
                    document.getElementById(`node-${state.sourceNodeForEdge.id}`).classList.remove('selected');
                    state.sourceNodeForEdge = null;
                    document.getElementById('operation-hint').textContent = '';
                    setMode('default');
                }
            }
        } else {
            // 默认模式，检查是否点击了节点或连接
            const clickedNode = findNodeAtPosition(x, y);
            if (clickedNode) {
                selectNode(clickedNode);
                return;
            }
            
            const clickedEdge = findEdgeAtPosition(x, y);
            if (clickedEdge) {
                selectEdge(clickedEdge);
                return;
            }
            
            // 如果没有点击任何对象，取消选择
            deselectAll();
        }
    }
    
    // 创建新节点
    function createNode(x, y) {
        const node = {
            id: state.nextNodeId++,
            name: `节点 ${state.nextNodeId - 1}`,
            x: x,
            y: y,
            balance: 0,
            inflow: 0,
            outflow: 0
        };
        
        state.nodes.push(node);
        renderNode(node);
        
        // 自动保存到本地存储
        saveToLocalStorage();
        
        return node;
    }
    
    // 渲染节点
    function renderNode(node) {
        // 检查是否已经存在这个节点的元素
        let nodeElement = document.getElementById(`node-${node.id}`);
        
        if (!nodeElement) {
            // 创建新的节点元素
            nodeElement = document.createElement('div');
            nodeElement.id = `node-${node.id}`;
            nodeElement.className = 'flowchart-node';
            nodeElement.dataset.id = node.id;
            
            // 创建节点名称元素
            const nameElement = document.createElement('div');
            nameElement.className = 'node-name';
            nodeElement.appendChild(nameElement);
            
            // 创建节点余额元素
            const balanceElement = document.createElement('div');
            balanceElement.className = 'node-balance';
            nodeElement.appendChild(balanceElement);
            
            // 添加点击事件
            nodeElement.addEventListener('click', function(e) {
                e.stopPropagation();
                selectNode(node);
            });
            
            // 添加到画布
            canvasContainer.appendChild(nodeElement);
            
            // 使节点可拖动
            makeDraggable(nodeElement, node);
        }
        
        // 更新节点内容
        const nameElement = nodeElement.querySelector('.node-name');
        const balanceElement = nodeElement.querySelector('.node-balance');
        
        nameElement.textContent = node.name;
        balanceElement.textContent = node.balance;
        
        // 更新节点位置
        nodeElement.style.left = `${node.x}px`;
        nodeElement.style.top = `${node.y}px`;
        
        return nodeElement;
    }
    
    // 使节点可拖动
    function makeDraggable(element, node) {
        let isDragging = false;
        let startX, startY;
        let originalX, originalY;
        
        element.addEventListener('mousedown', function(e) {
            // 如果是在添加连接模式，不启动拖动
            if (state.mode === 'add-edge') return;
            
            // 阻止事件冒泡和默认行为
            e.stopPropagation();
            e.preventDefault();
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            originalX = node.x;
            originalY = node.y;
            
            // 添加拖动时的样式
            element.classList.add('dragging');
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            // 计算移动距离
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // 更新节点位置
            node.x = originalX + dx;
            node.y = originalY + dy;
            
            // 更新节点元素位置
            element.style.left = `${node.x}px`;
            element.style.top = `${node.y}px`;
            
            // 更新与该节点相关的所有连接
            updateEdgesForNode(node);
        });
        
        document.addEventListener('mouseup', function() {
            if (!isDragging) return;
            
            isDragging = false;
            element.classList.remove('dragging');
            
            // 保存到本地存储
            saveToLocalStorage();
        });
    }
    
    // 更新与节点相关的所有连接
    function updateEdgesForNode(node) {
        state.edges.forEach(edge => {
            if (edge.source === node.id || edge.target === node.id) {
                updateEdgePosition(edge);
            }
        });
    }
    
    // 创建连接
    function createEdge(sourceNode, targetNode) {
        const edge = {
            id: state.nextEdgeId++,
            source: sourceNode.id,
            target: targetNode.id,
            amount: 0,
            description: ''
        };
        
        state.edges.push(edge);
        renderEdge(edge);
        
        // 自动保存到本地存储
        saveToLocalStorage();
        
        return edge;
    }
    
    // 渲染连接
    function renderEdge(edge) {
        const sourceNode = findNodeById(edge.source);
        const targetNode = findNodeById(edge.target);
        
        if (!sourceNode || !targetNode) {
            console.error('找不到边的源节点或目标节点', edge);
            return;
        }
        
        // 检查是否已经存在这条边的元素
        let edgeElement = document.getElementById(`edge-${edge.id}`);
        
        if (!edgeElement) {
            // 创建新的边元素
            edgeElement = document.createElement('div');
            edgeElement.id = `edge-${edge.id}`;
            edgeElement.className = 'flowchart-edge';
            edgeElement.dataset.id = edge.id;
            
            // 创建线条元素
            const lineElement = document.createElement('div');
            lineElement.className = 'edge-line';
            edgeElement.appendChild(lineElement);
            
            // 创建标签元素
            const labelElement = document.createElement('div');
            labelElement.className = 'edge-label';
            edgeElement.appendChild(labelElement);
            
            // 添加点击事件
            edgeElement.addEventListener('click', function(e) {
                e.stopPropagation();
                selectEdge(edge);
            });
            
            canvasContainer.appendChild(edgeElement);
        }
        
        // 更新边的位置和标签
        updateEdgePosition(edge);
        
        // 更新标签内容
        const labelElement = edgeElement.querySelector('.edge-label');
        labelElement.textContent = `${edge.amount}${edge.description ? ` (${edge.description})` : ''}`;
        
        return edgeElement;
    }
    
    // 更新所有连接
    function updateEdges() {
        state.edges.forEach(updateEdgePosition);
    }
    
    // 更新连接位置
    function updateEdgePosition(edge) {
        const edgeElement = document.getElementById(`edge-${edge.id}`);
        if (!edgeElement) return;
        
        const sourceNode = findNodeById(edge.source);
        const targetNode = findNodeById(edge.target);
        
        if (!sourceNode || !targetNode) {
            console.error('找不到边的源节点或目标节点', edge);
            return;
        }
        
        const sourceElement = document.getElementById(`node-${sourceNode.id}`);
        const targetElement = document.getElementById(`node-${targetNode.id}`);
        
        if (!sourceElement || !targetElement) {
            console.error('找不到边的源节点或目标节点元素', edge);
            return;
        }
        
        // 获取节点的位置和尺寸
        const sourceRect = sourceElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const canvasRect = canvasContainer.getBoundingClientRect();
        
        // 计算节点中心点相对于画布的位置
        const sourceX = sourceRect.left + sourceRect.width / 2 - canvasRect.left;
        const sourceY = sourceRect.top + sourceRect.height / 2 - canvasRect.top;
        const targetX = targetRect.left + targetRect.width / 2 - canvasRect.left;
        const targetY = targetRect.top + targetRect.height / 2 - canvasRect.top;
        
        // 计算边的长度和角度
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // 调整边的起点和终点，使其从节点边缘开始和结束
        const nodeRadius = 50; // 节点半径，根据实际情况调整
        const sourceOffsetX = Math.cos(angle * Math.PI / 180) * nodeRadius / 2;
        const sourceOffsetY = Math.sin(angle * Math.PI / 180) * nodeRadius / 2;
        const targetOffsetX = Math.cos(angle * Math.PI / 180) * nodeRadius / 2;
        const targetOffsetY = Math.sin(angle * Math.PI / 180) * nodeRadius / 2;
        
        const adjustedLength = length - nodeRadius;
        
        // 更新边的位置和旋转
        const lineElement = edgeElement.querySelector('.edge-line');
        lineElement.style.width = `${adjustedLength}px`;
        lineElement.style.left = `${sourceX + sourceOffsetX}px`;
        lineElement.style.top = `${sourceY + sourceOffsetY}px`;
        lineElement.style.transform = `rotate(${angle}deg)`;
        
        // 更新标签位置
        const labelElement = edgeElement.querySelector('.edge-label');
        labelElement.style.left = `${sourceX + dx / 2}px`;
        labelElement.style.top = `${sourceY + dy / 2}px`;
    }
    
    // 选择节点
    function selectNode(node) {
        console.log('选择节点:', node.id);
        
        // 取消之前的选择
        deselectAll();
        
        // 设置当前选中的节点
        state.selectedNode = node;
        
        // 高亮显示选中的节点
        const nodeElement = document.getElementById(`node-${node.id}`);
        if (nodeElement) {
            nodeElement.classList.add('selected');
        }
        
        // 显示节点属性面板
        nodeName.value = node.name;
        nodeBalance.value = node.balance;
        nodePropertiesPanel.classList.remove('hidden');
        edgePropertiesPanel.classList.add('hidden');
    }
    
    // 选择连接
    function selectEdge(edge) {
        console.log('选择连接:', edge.id);
        
        // 取消之前的选择
        deselectAll();
        
        // 设置当前选中的连接
        state.selectedEdge = edge;
        
        // 高亮显示选中的连接
        const edgeElement = document.getElementById(`edge-${edge.id}`);
        if (edgeElement) {
            edgeElement.classList.add('selected');
        }
        
        // 显示连接属性面板
        edgeAmount.value = edge.amount;
        edgeDescription.value = edge.description || '';
        edgePropertiesPanel.classList.remove('hidden');
        nodePropertiesPanel.classList.add('hidden');
    }
    
    // 取消所有选择
    function deselectAll() {
        // 取消节点选择
        if (state.selectedNode) {
            const nodeElement = document.getElementById(`node-${state.selectedNode.id}`);
            if (nodeElement) {
                nodeElement.classList.remove('selected');
            }
            state.selectedNode = null;
        }
        
        // 取消连接选择
        if (state.selectedEdge) {
            const edgeElement = document.getElementById(`edge-${state.selectedEdge.id}`);
            if (edgeElement) {
                edgeElement.classList.remove('selected');
            }
            state.selectedEdge = null;
        }
        
        // 隐藏属性面板
        nodePropertiesPanel.classList.add('hidden');
        edgePropertiesPanel.classList.add('hidden');
    }
    
    // 保存节点属性
    function saveNodeProperties() {
        if (!state.selectedNode) return;
        
        console.log('保存节点属性', nodeName.value, nodeBalance.value);
        
        // 更新节点属性
        state.selectedNode.name = nodeName.value;
        state.selectedNode.balance = parseFloat(nodeBalance.value) || 0;
        
        // 更新节点显示
        const nodeElement = document.getElementById(`node-${state.selectedNode.id}`);
        if (nodeElement) {
            const nameElement = nodeElement.querySelector('.node-name');
            const balanceElement = nodeElement.querySelector('.node-balance');
            
            if (nameElement) nameElement.textContent = state.selectedNode.name;
            if (balanceElement) balanceElement.textContent = state.selectedNode.balance;
        }
        
        // 重新计算流量
        calculateFlows();
        updateSummary();
        
        // 自动保存到本地存储
        saveToLocalStorage();
    }
    
    // 保存连接属性
    function saveEdgeProperties() {
        if (!state.selectedEdge) return;
        
        console.log('保存连接属性', edgeAmount.value, edgeDescription.value);
        
        // 更新连接属性
        state.selectedEdge.amount = parseFloat(edgeAmount.value) || 0;
        state.selectedEdge.description = edgeDescription.value;
        
        // 更新连接显示
        const edgeElement = document.getElementById(`edge-${state.selectedEdge.id}`);
        if (edgeElement) {
            const labelElement = edgeElement.querySelector('.edge-label');
            if (labelElement) {
                labelElement.textContent = `${state.selectedEdge.amount}${state.selectedEdge.description ? ` (${state.selectedEdge.description})` : ''}`;
            }
        }
        
        // 重新计算流量
        calculateFlows();
        updateSummary();
        
        // 自动保存到本地存储
        saveToLocalStorage();
    }
    
    // 删除选中的节点或连接
    function deleteSelected() {
        if (state.selectedNode) {
            console.log('删除选中的节点:', state.selectedNode.id);
            deleteNode(state.selectedNode);
        } else if (state.selectedEdge) {
            console.log('删除选中的连接:', state.selectedEdge.id);
            deleteEdge(state.selectedEdge);
        } else {
            console.log('没有选中要删除的内容');
        }
    }
    
    // 删除节点及其所有连接的连接
    function deleteNode(node) {
        // 删除与该节点相关的所有边
        const relatedEdges = state.edges.filter(edge => 
            edge.source === node.id || edge.target === node.id
        );
        
        relatedEdges.forEach(edge => {
            deleteEdge(edge);
        });
        
        // 从状态中删除节点
        state.nodes = state.nodes.filter(n => n.id !== node.id);
        
        // 从DOM中删除节点元素
        const nodeElement = document.getElementById(`node-${node.id}`);
        if (nodeElement) {
            nodeElement.remove();
        }
        
        // 如果删除的是当前选中的节点，清除选中状态
        if (state.selectedNode && state.selectedNode.id === node.id) {
            state.selectedNode = null;
            nodePropertiesPanel.classList.add('hidden');
        }
        
        // 重新计算流量
        calculateFlows();
        updateSummary();
        
        // 自动保存到本地存储
        saveToLocalStorage();
    }
    
    // 删除连接
    function deleteEdge(edge) {
        // 从状态中删除边
        state.edges = state.edges.filter(e => e.id !== edge.id);
        
        // 从DOM中删除边元素
        const edgeElement = document.getElementById(`edge-${edge.id}`);
        if (edgeElement) {
            edgeElement.remove();
        }
        
        // 如果删除的是当前选中的边，清除选中状态
        if (state.selectedEdge && state.selectedEdge.id === edge.id) {
            state.selectedEdge = null;
            edgePropertiesPanel.classList.add('hidden');
        }
        
        // 重新计算流量
        calculateFlows();
        updateSummary();
        
        // 自动保存到本地存储
        saveToLocalStorage();
    }
    
    // 计算流量
    function calculateFlows() {
        console.log('计算流量');
        
        // 重置所有节点的流入和流出
        state.nodes.forEach(node => {
            node.inflow = 0;
            node.outflow = 0;
        });
        
        // 计算每个节点的流入和流出
        state.edges.forEach(edge => {
            const sourceNode = findNodeById(edge.source);
            const targetNode = findNodeById(edge.target);
            
            if (sourceNode && targetNode) {
                const amount = parseFloat(edge.amount) || 0;
                sourceNode.outflow += amount;
                targetNode.inflow += amount;
            }
        });
    }
    
    // 更新汇总面板
    function updateSummary() {
        console.log('更新汇总');
        
        let summaryHTML = '';
        
        // 节点和连接总数
        summaryHTML += `<div class="summary-item">节点数量: ${state.nodes.length}</div>`;
        summaryHTML += `<div class="summary-item">连接数量: ${state.edges.length}</div>`;
        
        // 总流量
        let totalFlow = 0;
        state.edges.forEach(edge => {
            totalFlow += parseFloat(edge.amount) || 0;
        });
        summaryHTML += `<div class="summary-item">总流量: ${totalFlow}</div>`;
        
        // 节点余额
        if (state.nodes.length > 0) {
            summaryHTML += '<div class="summary-item"><strong>节点余额:</strong></div>';
            state.nodes.forEach(node => {
                const netFlow = node.inflow - node.outflow;
                const finalBalance = node.balance + netFlow;
                const flowClass = netFlow > 0 ? 'positive' : (netFlow < 0 ? 'negative' : '');
                const balanceClass = finalBalance > 0 ? 'positive' : (finalBalance < 0 ? 'negative' : '');
                
                summaryHTML += `<div class="summary-item">
                    ${node.name}: 
                    <span class="${balanceClass}">${finalBalance}</span>
                    (流入: <span class="positive">${node.inflow}</span>, 
                    流出: <span class="negative">${node.outflow}</span>, 
                    净流量: <span class="${flowClass}">${netFlow}</span>)
                </div>`;
            });
        }
        
        summaryContent.innerHTML = summaryHTML;
    }
    
    // 取消当前操作
    function cancelCurrentOperation() {
        console.log('取消当前操作');
        
        setMode('default');
        state.sourceNodeForEdge = null;
        document.querySelectorAll('.flowchart-node').forEach(el => {
            el.classList.remove('selected');
        });
    }
    
    // 通过ID查找节点
    function findNodeById(id) {
        return state.nodes.find(node => node.id === id);
    }
    
    // 通过ID查找连接
    function findEdgeById(id) {
        return state.edges.find(edge => edge.id === id);
    }
    
    // 数据持久化相关函数
    function saveToLocalStorage() {
        const data = {
            nodes: state.nodes,
            edges: state.edges,
            nextNodeId: state.nextNodeId,
            nextEdgeId: state.nextEdgeId,
            canvasOffsetX: state.canvasOffsetX,
            canvasOffsetY: state.canvasOffsetY
        };
        
        localStorage.setItem('flowchartData', JSON.stringify(data));
        console.log('数据已保存到本地存储');
    }
    
    function loadFromLocalStorage() {
        const savedData = localStorage.getItem('flowchartData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                
                // 清空当前画布
                clearCanvas();
                
                // 恢复状态
                state.nodes = data.nodes || [];
                state.edges = data.edges || [];
                state.nextNodeId = data.nextNodeId || 1;
                state.nextEdgeId = data.nextEdgeId || 1;
                state.canvasOffsetX = data.canvasOffsetX || 0;
                state.canvasOffsetY = data.canvasOffsetY || 0;
                
                // 更新画布位置
                updateCanvasPosition(0, 0);
                
                // 重新渲染所有节点和边
                state.nodes.forEach(node => renderNode(node));
                state.edges.forEach(edge => renderEdge(edge));
                
                // 计算流量并更新汇总信息
                calculateFlows();
                updateSummary();
                
                console.log('从本地存储加载了数据');
            } catch (error) {
                console.error('加载数据时出错', error);
                alert('加载数据时出错: ' + error.message);
            }
        }
    }
    
    function clearAllData() {
        // 清空本地存储
        localStorage.removeItem('flowchartData');
        
        // 重置状态
        state.nodes = [];
        state.edges = [];
        state.nextNodeId = 1;
        state.nextEdgeId = 1;
        state.selectedNode = null;
        state.selectedEdge = null;
        state.sourceNodeForEdge = null;
        state.canvasOffsetX = 0;
        state.canvasOffsetY = 0;
        
        // 清空画布
        clearCanvas();
        
        // 更新画布位置
        updateCanvasPosition(0, 0);
        
        // 更新汇总信息
        updateSummary();
        
        console.log('已清空所有数据');
    }
    
    function clearCanvas() {
        // 移除所有节点和边元素
        document.querySelectorAll('.flowchart-node, .flowchart-edge').forEach(el => {
            el.remove();
        });
        
        // 隐藏属性面板
        nodePropertiesPanel.classList.add('hidden');
        edgePropertiesPanel.classList.add('hidden');
    }
    
    function exportData() {
        const data = {
            nodes: state.nodes,
            edges: state.edges,
            nextNodeId: state.nextNodeId,
            nextEdgeId: state.nextEdgeId,
            canvasOffsetX: state.canvasOffsetX,
            canvasOffsetY: state.canvasOffsetY
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'flowchart-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('数据已导出');
    }
    
    function importData(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // 清空当前画布
                clearCanvas();
                
                // 恢复状态
                state.nodes = data.nodes || [];
                state.edges = data.edges || [];
                state.nextNodeId = data.nextNodeId || 1;
                state.nextEdgeId = data.nextEdgeId || 1;
                state.canvasOffsetX = data.canvasOffsetX || 0;
                state.canvasOffsetY = data.canvasOffsetY || 0;
                
                // 更新画布位置
                updateCanvasPosition(0, 0);
                
                // 重新渲染所有节点和边
                state.nodes.forEach(node => renderNode(node));
                state.edges.forEach(edge => renderEdge(edge));
                
                // 计算流量并更新汇总信息
                calculateFlows();
                updateSummary();
                
                // 保存到本地存储
                saveToLocalStorage();
                
                console.log('已导入数据');
                alert('数据导入成功');
            } catch (error) {
                console.error('导入数据时出错', error);
                alert('导入数据时出错: ' + error.message);
            }
        };
        
        reader.onerror = function() {
            console.error('读取文件时出错');
            alert('读取文件时出错');
        };
        
        reader.readAsText(file);
    }
    
    // 修改findNodeAtPosition函数
    function findNodeAtPosition(x, y) {
        // 简单实现：检查点击位置是否在节点元素内
        for (const node of state.nodes) {
            const nodeElement = document.getElementById(`node-${node.id}`);
            if (nodeElement) {
                const rect = nodeElement.getBoundingClientRect();
                const canvasRect = canvasContainer.getBoundingClientRect();
                
                const nodeX = rect.left - canvasRect.left + rect.width / 2;
                const nodeY = rect.top - canvasRect.top + rect.height / 2;
                const nodeRadius = rect.width / 2;
                
                const distance = Math.sqrt(Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2));
                
                if (distance <= nodeRadius) {
                    return node;
                }
            }
        }
        
        return null;
    }
    
    // 修改findEdgeAtPosition函数
    function findEdgeAtPosition(x, y) {
        // 简单实现：检查点击位置是否在连接线附近
        for (const edge of state.edges) {
            const edgeElement = document.getElementById(`edge-${edge.id}`);
            if (edgeElement) {
                const sourceNode = findNodeById(edge.source);
                const targetNode = findNodeById(edge.target);
                
                if (!sourceNode || !targetNode) continue;
                
                const sourceElement = document.getElementById(`node-${sourceNode.id}`);
                const targetElement = document.getElementById(`node-${targetNode.id}`);
                
                if (!sourceElement || !targetElement) continue;
                
                const sourceRect = sourceElement.getBoundingClientRect();
                const targetRect = targetElement.getBoundingClientRect();
                const canvasRect = canvasContainer.getBoundingClientRect();
                
                const sourceX = sourceRect.left - canvasRect.left + sourceRect.width / 2;
                const sourceY = sourceRect.top - canvasRect.top + sourceRect.height / 2;
                const targetX = targetRect.left - canvasRect.left + targetRect.width / 2;
                const targetY = targetRect.top - canvasRect.top + targetRect.height / 2;
                
                // 计算点到线段的距离
                const distance = distanceToLine(x, y, sourceX, sourceY, targetX, targetY);
                
                // 如果距离小于阈值，认为点击了这条边
                if (distance < 10) {
                    return edge;
                }
            }
        }
        
        return null;
    }
    
    // 计算点到线段的距离
    function distanceToLine(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        
        if (len_sq !== 0) {
            param = dot / len_sq;
        }
        
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
    
    // 初始化应用
    init();
});
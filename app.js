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
    
    // 应用状态
    const state = {
        nodes: [],
        edges: [],
        nextNodeId: 1,
        nextEdgeId: 1,
        selectedNode: null,
        selectedEdge: null,
        mode: 'default', // 'default', 'add-node', 'add-edge'
        sourceNodeForEdge: null
    };
    
    // 初始化应用
    function init() {
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
            }
        });
        
        // 初始化汇总信息
        updateSummary();
        
        console.log('应用程序初始化完成');
    }
    
    // 设置当前模式
    function setMode(mode) {
        console.log('设置模式为:', mode);
        state.mode = mode;
        
        // 重置源节点（如果切换出添加连接模式）
        if (mode !== 'add-edge') {
            state.sourceNodeForEdge = null;
        }
        
        // 更新UI以反映当前模式
        addNodeBtn.classList.toggle('active', mode === 'add-node');
        addEdgeBtn.classList.toggle('active', mode === 'add-edge');
    }
    
    // 处理画布点击
    function handleCanvasClick(e) {
        // 只处理直接在画布上的点击，而不是在节点或边上的点击
        if (e.target !== canvasContainer) {
            console.log('点击不在画布上，而是在:', e.target);
            return;
        }
        
        if (state.mode === 'add-node') {
            console.log('在点击位置添加节点');
            const rect = canvasContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            createNode(x, y);
            setMode('default');
        }
    }
    
    // 创建新节点
    function createNode(x, y) {
        const nodeId = 'node-' + state.nextNodeId++;
        const nodeName = '节点 ' + (state.nextNodeId - 1);
        
        console.log('创建节点:', nodeId, '在', x, y);
        
        const node = {
            id: nodeId,
            name: nodeName,
            balance: 0,
            x: x,
            y: y,
            inflow: 0,
            outflow: 0
        };
        
        state.nodes.push(node);
        renderNode(node);
        updateSummary();
    }
    
    // 渲染节点
    function renderNode(node) {
        console.log('渲染节点:', node.id);
        
        const nodeElement = document.createElement('div');
        nodeElement.id = node.id;
        nodeElement.className = 'flowchart-node';
        nodeElement.style.left = node.x + 'px';
        nodeElement.style.top = node.y + 'px';
        
        const nameElement = document.createElement('div');
        nameElement.className = 'node-name';
        nameElement.textContent = node.name;
        
        const balanceElement = document.createElement('div');
        balanceElement.className = 'node-balance';
        balanceElement.textContent = '余额: ' + node.balance;
        
        nodeElement.appendChild(nameElement);
        nodeElement.appendChild(balanceElement);
        
        canvasContainer.appendChild(nodeElement);
        
        // 添加拖动功能
        makeDraggable(nodeElement, node);
        
        // 节点点击事件
        nodeElement.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('节点被点击:', node.id);
            
            if (state.mode === 'add-edge') {
                if (!state.sourceNodeForEdge) {
                    // 第一次节点点击 - 设置为源节点
                    state.sourceNodeForEdge = node;
                    nodeElement.classList.add('selected');
                } else if (state.sourceNodeForEdge !== node) {
                    // 第二次节点点击 - 创建连接
                    createEdge(state.sourceNodeForEdge, node);
                    document.querySelectorAll('.flowchart-node').forEach(el => {
                        el.classList.remove('selected');
                    });
                    state.sourceNodeForEdge = null;
                    setMode('default');
                }
            } else {
                // 选择节点进行编辑
                selectNode(node);
            }
        });
    }
    
    // 使节点可拖动
    function makeDraggable(element, node) {
        let isDragging = false;
        let offsetX, offsetY;
        
        element.addEventListener('mousedown', function(e) {
            isDragging = true;
            offsetX = e.clientX - element.offsetLeft;
            offsetY = e.clientY - element.offsetTop;
            element.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                const x = e.clientX - offsetX;
                const y = e.clientY - offsetY;
                
                // 确保节点不会被拖出画布
                const containerRect = canvasContainer.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                
                const maxX = containerRect.width - elementRect.width;
                const maxY = containerRect.height - elementRect.height;
                
                const boundedX = Math.max(0, Math.min(x, maxX));
                const boundedY = Math.max(0, Math.min(y, maxY));
                
                element.style.left = boundedX + 'px';
                element.style.top = boundedY + 'px';
                
                // 更新节点位置
                node.x = boundedX;
                node.y = boundedY;
                
                // 更新连接
                updateEdges();
            }
        });
        
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = '';
            }
        });
    }
    
    // 创建连接
    function createEdge(sourceNode, targetNode) {
        const edgeId = 'edge-' + state.nextEdgeId++;
        
        console.log('创建连接:', edgeId, '从', sourceNode.id, '到', targetNode.id);
        
        const edge = {
            id: edgeId,
            sourceId: sourceNode.id,
            targetId: targetNode.id,
            amount: 0,
            description: ''
        };
        
        state.edges.push(edge);
        renderEdge(edge);
        calculateFlows();
        updateSummary();
    }
    
    // 渲染连接
    function renderEdge(edge) {
        const sourceNode = findNodeById(edge.sourceId);
        const targetNode = findNodeById(edge.targetId);
        
        if (!sourceNode || !targetNode) return;
        
        // 创建连接元素
        const edgeElement = document.createElement('div');
        edgeElement.id = edge.id;
        edgeElement.className = 'flowchart-edge';
        
        // 创建连接线
        const lineElement = document.createElement('div');
        lineElement.className = 'edge-line';
        
        // 创建标签
        const labelElement = document.createElement('div');
        labelElement.className = 'edge-label';
        labelElement.textContent = edge.amount;
        
        edgeElement.appendChild(lineElement);
        edgeElement.appendChild(labelElement);
        canvasContainer.appendChild(edgeElement);
        
        // 更新连接位置
        updateEdgePosition(edge);
        
        // 添加点击事件
        edgeElement.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('连接被点击:', edge.id);
            selectEdge(edge);
        });
    }
    
    // 更新所有连接
    function updateEdges() {
        state.edges.forEach(updateEdgePosition);
    }
    
    // 更新连接位置
    function updateEdgePosition(edge) {
        const edgeElement = document.getElementById(edge.id);
        if (!edgeElement) return;
        
        const sourceNode = findNodeById(edge.sourceId);
        const targetNode = findNodeById(edge.targetId);
        
        if (!sourceNode || !targetNode) return;
        
        const sourceElement = document.getElementById(sourceNode.id);
        const targetElement = document.getElementById(targetNode.id);
        
        if (!sourceElement || !targetElement) return;
        
        // 计算源节点和目标节点的中心点
        const sourceRect = sourceElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = canvasContainer.getBoundingClientRect();
        
        const sourceX = sourceRect.left - containerRect.left + sourceRect.width / 2;
        const sourceY = sourceRect.top - containerRect.top + sourceRect.height / 2;
        const targetX = targetRect.left - containerRect.left + targetRect.width / 2;
        const targetY = targetRect.top - containerRect.top + targetRect.height / 2;
        
        // 计算连接线的长度和角度
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // 更新连接线的样式
        const lineElement = edgeElement.querySelector('.edge-line');
        lineElement.style.width = length + 'px';
        lineElement.style.transform = `translate(${sourceX}px, ${sourceY}px) rotate(${angle}deg)`;
        lineElement.style.transformOrigin = '0 0';
        
        // 更新标签位置
        const labelElement = edgeElement.querySelector('.edge-label');
        labelElement.style.left = (sourceX + targetX) / 2 + 'px';
        labelElement.style.top = (sourceY + targetY) / 2 + 'px';
    }
    
    // 选择节点进行编辑
    function selectNode(node) {
        // 取消选择之前选择的节点或连接
        deselectAll();
        
        console.log('选择节点:', node.id);
        
        state.selectedNode = node;
        document.getElementById(node.id).classList.add('selected');
        
        // 显示节点属性面板
        nodePropertiesPanel.classList.remove('hidden');
        edgePropertiesPanel.classList.add('hidden');
        
        // 填充表单字段
        nodeName.value = node.name;
        nodeBalance.value = node.balance;
    }
    
    // 选择连接进行编辑
    function selectEdge(edge) {
        // 取消选择之前选择的节点或连接
        deselectAll();
        
        console.log('选择连接:', edge.id);
        
        state.selectedEdge = edge;
        document.getElementById(edge.id).classList.add('selected');
        
        // 显示连接属性面板
        edgePropertiesPanel.classList.remove('hidden');
        nodePropertiesPanel.classList.add('hidden');
        
        // 填充表单字段
        edgeAmount.value = edge.amount;
        edgeDescription.value = edge.description || '';
    }
    
    // 取消选择所有节点和连接
    function deselectAll() {
        console.log('取消选择所有');
        
        // 移除所有节点的选择类
        document.querySelectorAll('.flowchart-node').forEach(el => {
            el.classList.remove('selected');
        });
        
        // 移除所有连接的选择类
        document.querySelectorAll('.flowchart-edge').forEach(el => {
            el.classList.remove('selected');
        });
        
        state.selectedNode = null;
        state.selectedEdge = null;
    }
    
    // 保存节点属性
    function saveNodeProperties() {
        if (!state.selectedNode) return;
        
        const node = state.selectedNode;
        node.name = nodeName.value;
        node.balance = parseFloat(nodeBalance.value) || 0;
        
        console.log('保存节点属性:', node.id, node.name, node.balance);
        
        // 更新节点显示
        const nodeElement = document.getElementById(node.id);
        if (nodeElement) {
            const nameElement = nodeElement.querySelector('.node-name');
            const balanceElement = nodeElement.querySelector('.node-balance');
            
            if (nameElement) nameElement.textContent = node.name;
            if (balanceElement) balanceElement.textContent = '余额: ' + node.balance;
        }
        
        calculateFlows();
        updateSummary();
        nodePropertiesPanel.classList.add('hidden');
        deselectAll();
    }
    
    // 保存连接属性
    function saveEdgeProperties() {
        if (!state.selectedEdge) return;
        
        const edge = state.selectedEdge;
        edge.amount = parseFloat(edgeAmount.value) || 0;
        edge.description = edgeDescription.value;
        
        console.log('保存连接属性:', edge.id, edge.amount, edge.description);
        
        // 更新连接标签
        const edgeElement = document.getElementById(edge.id);
        if (edgeElement) {
            const labelElement = edgeElement.querySelector('.edge-label');
            if (labelElement) {
                let labelText = edge.amount.toString();
                if (edge.description) {
                    labelText += ' (' + edge.description + ')';
                }
                labelElement.textContent = labelText;
            }
        }
        
        calculateFlows();
        updateSummary();
        edgePropertiesPanel.classList.add('hidden');
        deselectAll();
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
        // 首先删除所有连接的连接
        const connectedEdges = state.edges.filter(edge => 
            edge.sourceId === node.id || edge.targetId === node.id
        );
        
        console.log('删除连接的连接:', connectedEdges.length);
        connectedEdges.forEach(deleteEdge);
        
        // 从DOM中删除节点元素
        const nodeElement = document.getElementById(node.id);
        if (nodeElement) {
            canvasContainer.removeChild(nodeElement);
        }
        
        // 从数据模型中删除
        state.nodes = state.nodes.filter(n => n.id !== node.id);
        
        state.selectedNode = null;
        nodePropertiesPanel.classList.add('hidden');
        calculateFlows();
        updateSummary();
    }
    
    // 删除连接
    function deleteEdge(edge) {
        // 从DOM中删除连接元素
        const edgeElement = document.getElementById(edge.id);
        if (edgeElement) {
            canvasContainer.removeChild(edgeElement);
        }
        
        // 从数据模型中删除
        state.edges = state.edges.filter(e => e.id !== edge.id);
        
        state.selectedEdge = null;
        edgePropertiesPanel.classList.add('hidden');
        calculateFlows();
        updateSummary();
    }
    
    // 计算资金流动
    function calculateFlows() {
        console.log('计算流动');
        
        // 重置所有节点流动
        state.nodes.forEach(node => {
            node.inflow = 0;
            node.outflow = 0;
        });
        
        // 计算每个节点的流入和流出
        state.edges.forEach(edge => {
            const sourceNode = findNodeById(edge.sourceId);
            const targetNode = findNodeById(edge.targetId);
            
            if (sourceNode && targetNode) {
                sourceNode.outflow += edge.amount;
                targetNode.inflow += edge.amount;
            }
        });
        
        // 更新节点显示
        state.nodes.forEach(node => {
            const nodeElement = document.getElementById(node.id);
            if (nodeElement) {
                const balanceElement = nodeElement.querySelector('.node-balance');
                if (balanceElement) {
                    const netFlow = node.inflow - node.outflow;
                    const finalBalance = node.balance + netFlow;
                    balanceElement.textContent = '余额: ' + finalBalance;
                    
                    // 添加正/负余额的视觉指示
                    if (finalBalance > 0) {
                        balanceElement.classList.add('positive');
                        balanceElement.classList.remove('negative');
                    } else if (finalBalance < 0) {
                        balanceElement.classList.add('negative');
                        balanceElement.classList.remove('positive');
                    } else {
                        balanceElement.classList.remove('positive', 'negative');
                    }
                }
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
            totalFlow += edge.amount;
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
    
    // 初始化应用
    init();
});
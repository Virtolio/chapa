class SistemaChapitas {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        this.currentTab = 'inventario';
        this.apiBase = '/api';
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuth();
        this.configurarSelectPedidos();
    }

    bindEvents() {
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        document.querySelectorAll('.nav-link[data-tab]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(e.target.getAttribute('data-tab'));
            });
        });

        document.getElementById('add-inventario-btn').addEventListener('click', () => this.showInventarioModal());
        document.getElementById('add-pedido-btn').addEventListener('click', () => this.showPedidoModal());
        document.getElementById('add-despacho-btn').addEventListener('click', () => this.showDespachoModal());

        document.getElementById('save-inventario').addEventListener('click', () => this.saveInventario());
        document.getElementById('save-pedido').addEventListener('click', () => this.savePedido());
        document.getElementById('save-despacho').addEventListener('click', () => this.saveDespacho());
    }

    async checkAuth() {
        if (this.token && this.user.username) {
            await this.showApp();
        } else {
            this.showLogin();
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;

                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));

                await this.showApp();
            } else {
                alert(data.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión con el servidor');
        }
    }

    handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.user = {};
        this.showLogin();
    }

    showLogin() {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('app-section').style.display = 'none';
    }

    async showApp() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('app-section').style.display = 'block';
        document.getElementById('username-display').textContent = this.user.username;

        const isAdmin = this.user.role === 'administrador';
        document.getElementById('add-inventario-btn').style.display = isAdmin ? 'block' : 'none';

        await this.loadData();
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        document.getElementById(`${tabName}-tab`).style.display = 'block';
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        this.currentTab = tabName;
        this.loadData();
    }

    async loadData() {
        try {
            if (this.currentTab === 'inventario') {
                await this.loadInventario();
            } else if (this.currentTab === 'pedidos') {
                await this.loadPedidos();
            } else if (this.currentTab === 'despachos') {
                await this.loadDespachos();
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    }

    // ========== INVENTARIO ==========
    async loadInventario() {
        try {
            const response = await fetch(`${this.apiBase}/inventario`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) throw new Error('Error cargando inventario');

            const inventario = await response.json();
            this.renderInventario(inventario);
        } catch (error) {
            console.error('Error cargando inventario:', error);
            document.getElementById('inventario-body').innerHTML =
                '<tr><td colspan="6" class="text-center text-danger">Error cargando inventario</td></tr>';
        }
    }

    renderInventario(inventario) {
        const tbody = document.getElementById('inventario-body');
        tbody.innerHTML = '';

        if (inventario.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay items en el inventario</td></tr>';
            return;
        }

        inventario.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.medida}</td>
                <td>${item.tipoChapa}</td>
                <td>${item.materialChapa}</td>
                <td class="cantidad-roja">${item.cantidadDisponible}</td>
                <td>${item.comentarios || '-'}</td>
                <td>
                    ${this.user.role === 'administrador' ? `
                    <button class="btn btn-sm btn-warning btn-action" onclick="app.editInventario('${item._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-action" onclick="app.deleteInventario('${item._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : '<span class="text-muted">Solo lectura</span>'}
                </td>
            `;
            tbody.appendChild(tr);
        });

        this.configurarOrdenamientoTabla('inventario-table');
    }

    showInventarioModal(item = null) {
        const modal = new bootstrap.Modal(document.getElementById('inventarioModal'));
        const title = document.getElementById('inventarioModalTitle');

        if (item) {
            title.textContent = 'Editar Item del Inventario';
            document.getElementById('inventario-id').value = item._id;
            document.getElementById('medida').value = item.medida;
            document.getElementById('tipo-chapa').value = item.tipoChapa;
            document.getElementById('material-chapa').value = item.materialChapa;
            document.getElementById('cantidad-disponible').value = item.cantidadDisponible;
            document.getElementById('comentarios-inv').value = item.comentarios || '';
        } else {
            title.textContent = 'Agregar Item al Inventario';
            document.getElementById('inventario-form').reset();
            document.getElementById('inventario-id').value = '';
        }

        modal.show();
    }

    async saveInventario() {
        try {
            const formData = {
                medida: document.getElementById('medida').value,
                tipoChapa: document.getElementById('tipo-chapa').value,
                materialChapa: document.getElementById('material-chapa').value,
                cantidadDisponible: parseInt(document.getElementById('cantidad-disponible').value),
                comentarios: document.getElementById('comentarios-inv').value
            };

            const id = document.getElementById('inventario-id').value;

            // Si es edición (tiene ID), actualizar normalmente
            if (id) {
                const url = `${this.apiBase}/inventario/${id}`;
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    bootstrap.Modal.getInstance(document.getElementById('inventarioModal')).hide();
                    await this.loadInventario();
                    this.mostrarMensajeExito('Item actualizado exitosamente');
                } else {
                    const error = await response.json();
                    alert(error.message || 'Error actualizando el item');
                }
            }
            // Si es nuevo item, verificar si ya existe uno igual
            else {
                // Primero buscar si ya existe un item con las mismas características
                const responseBuscar = await fetch(`${this.apiBase}/inventario`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });

                if (responseBuscar.ok) {
                    const inventarioExistente = await responseBuscar.json();

                    // Buscar item con misma medida, tipo y material
                    const itemExistente = inventarioExistente.find(item =>
                        item.medida === formData.medida &&
                        item.tipoChapa === formData.tipoChapa &&
                        item.materialChapa === formData.materialChapa
                    );

                    if (itemExistente) {
                        // Si existe, ACTUALIZAR sumando la cantidad
                        const nuevaCantidad = itemExistente.cantidadDisponible + formData.cantidadDisponible;
                        const comentariosCombinados = itemExistente.comentarios && formData.comentarios
                            ? `${itemExistente.comentarios} | ${formData.comentarios}`
                            : (itemExistente.comentarios || formData.comentarios || '');

                        const responseUpdate = await fetch(`${this.apiBase}/inventario/${itemExistente._id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.token}`
                            },
                            body: JSON.stringify({
                                ...itemExistente,
                                cantidadDisponible: nuevaCantidad,
                                comentarios: comentariosCombinados
                            })
                        });

                        if (responseUpdate.ok) {
                            bootstrap.Modal.getInstance(document.getElementById('inventarioModal')).hide();
                            await this.loadInventario();
                            this.mostrarMensajeExito(`Stock actualizado. Nueva cantidad: ${nuevaCantidad}`);
                        } else {
                            const error = await responseUpdate.json();
                            alert(error.message || 'Error actualizando el item existente');
                        }
                    } else {
                        // Si no existe, crear nuevo item
                        const responseCreate = await fetch(`${this.apiBase}/inventario`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.token}`
                            },
                            body: JSON.stringify(formData)
                        });

                        if (responseCreate.ok) {
                            bootstrap.Modal.getInstance(document.getElementById('inventarioModal')).hide();
                            await this.loadInventario();
                            this.mostrarMensajeExito('Nuevo item creado exitosamente');
                        } else {
                            const error = await responseCreate.json();
                            alert(error.message || 'Error creando el item');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    }

    async editInventario(id) {
        try {
            const response = await fetch(`${this.apiBase}/inventario/${id}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const item = await response.json();
                this.showInventarioModal(item);
            } else {
                alert('Error cargando el item para editar');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    }

    async deleteInventario(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este item?')) {
            try {
                const response = await fetch(`${this.apiBase}/inventario/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });

                if (response.ok) {
                    await this.loadInventario();
                } else {
                    alert('Error eliminando el item');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión');
            }
        }
    }

    // ========== PEDIDOS ==========
    async loadPedidos() {
        try {
            const response = await fetch(`${this.apiBase}/pedidos`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) throw new Error('Error cargando pedidos');

            const pedidos = await response.json();
            this.renderPedidos(pedidos);
        } catch (error) {
            console.error('Error cargando pedidos:', error);
            document.getElementById('pedidos-body').innerHTML =
                '<tr><td colspan="9" class="text-center text-danger">Error cargando pedidos</td></tr>';
        }
    }

    renderPedidos(pedidos) {
        const tbody = document.getElementById('pedidos-body');
        tbody.innerHTML = '';

        if (pedidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">No hay pedidos registrados</td></tr>';
            return;
        }

        const estadoClasses = {
            'No Comenzadas': 'estado-no-comenzadas',
            'En Producción': 'estado-en-produccion',
            'Entregadas': 'estado-entregadas',
            'Canceladas': 'estado-canceladas'
        };

        pedidos.forEach(pedido => {
            const estadoClass = estadoClasses[pedido.estadoPedido] || 'estado-no-comenzadas';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${pedido.idPedido}</strong></td>
                <td>${pedido.cantidadChapitas}</td>
                <td>${pedido.medida}</td>
                <td>${pedido.tipoChapa}</td>
                <td>${pedido.materialChapa}</td>
                <td>${pedido.clienteDiseno}</td>
                <td>
                    <span class="estado-badge ${estadoClass}">
                        ${pedido.estadoPedido}
                    </span>
                </td>
                <td>${pedido.comentarios || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-warning btn-action" onclick="app.editPedido('${pedido._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-action" onclick="app.deletePedido('${pedido._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        this.configurarOrdenamientoTabla('pedidos-table');
    }

    showPedidoModal(pedido = null) {
        const modal = new bootstrap.Modal(document.getElementById('pedidoModal'));
        const title = document.getElementById('pedidoModalTitle');

        if (pedido) {
            title.textContent = 'Editar Pedido';
            document.getElementById('pedido-id').value = pedido._id;
            document.getElementById('cantidad-chapitas').value = pedido.cantidadChapitas;
            document.getElementById('medida-pedido').value = pedido.medida;
            document.getElementById('tipo-chapa-pedido').value = pedido.tipoChapa;
            document.getElementById('material-chapa-pedido').value = pedido.materialChapa;
            document.getElementById('cliente-diseno').value = pedido.clienteDiseno;
            document.getElementById('estado-pedido').value = pedido.estadoPedido;
            document.getElementById('comentarios-pedido').value = pedido.comentarios || '';
        } else {
            title.textContent = 'Crear Pedido';
            document.getElementById('pedido-form').reset();
            document.getElementById('pedido-id').value = '';
            document.getElementById('estado-pedido').value = 'No Comenzadas';
        }

        modal.show();
    }

    async savePedido() {
        try {
            const formData = {
                cantidadChapitas: parseInt(document.getElementById('cantidad-chapitas').value),
                medida: document.getElementById('medida-pedido').value,
                tipoChapa: document.getElementById('tipo-chapa-pedido').value,
                materialChapa: document.getElementById('material-chapa-pedido').value,
                clienteDiseno: document.getElementById('cliente-diseno').value,
                estadoPedido: document.getElementById('estado-pedido').value,
                comentarios: document.getElementById('comentarios-pedido').value
            };

            if (!formData.medida || !formData.tipoChapa || !formData.materialChapa) {
                alert('❌ Por favor, selecciona medida, tipo y material de chapa');
                return;
            }

            const id = document.getElementById('pedido-id').value;
            const url = id ? `${this.apiBase}/pedidos/${id}` : `${this.apiBase}/pedidos`;
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();

                bootstrap.Modal.getInstance(document.getElementById('pedidoModal')).hide();

                if (!id) {
                    const pedidoParaDespacho = result.pedido || result;
                    await this.crearDespachoAutomatico(pedidoParaDespacho);
                }

                await this.loadPedidos();
                await this.loadInventario();

                const mensaje = id ? 'Pedido actualizado exitosamente' : 'Pedido creado exitosamente';
                this.mostrarMensajeExito(mensaje);

            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error guardando el pedido');
            }
        } catch (error) {
            console.error('Error guardando pedido:', error);
            alert('❌ Error: ' + error.message);
        }
    }

    async editPedido(id) {
        try {
            const response = await fetch(`${this.apiBase}/pedidos/${id}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const pedido = await response.json();
                this.showPedidoModal(pedido);
            } else {
                alert('Error cargando el pedido para editar');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    }

    async deletePedido(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
            try {
                const response = await fetch(`${this.apiBase}/pedidos/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });

                if (response.ok) {
                    await this.loadPedidos();
                } else {
                    alert('Error eliminando el pedido');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión');
            }
        }
    }

    // ========== DESPACHOS ==========
    async loadDespachos() {
        try {
            const response = await fetch(`${this.apiBase}/despachos`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) throw new Error('Error cargando despachos');

            const despachos = await response.json();
            this.renderDespachos(despachos);
            this.actualizarTodosLosResumenes();  // ← CAMBIA ESTA LÍNEA

        } catch (error) {
            console.error('Error cargando despachos:', error);
            document.getElementById('despachos-body').innerHTML =
                '<tr><td colspan="10" class="text-center text-danger">Error cargando despachos</td></tr>';
        }
    }

    renderDespachos(despachos) {
        const tbody = document.getElementById('despachos-body');
        tbody.innerHTML = '';

        if (despachos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center">No hay despachos registrados</td></tr>';
            return;
        }

        despachos.forEach(despacho => {
            const estadoClass = `estado-${despacho.estadoAbono.toLowerCase().replace(' ', '-')}`;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${despacho.idPedido}</strong></td>
                <td>${despacho.clienteDiseno}</td>
                <td>${despacho.cantidadChapas}</td>
                <td>${despacho.medida}</td>
                <td>${despacho.tipoChapa}</td>
                <td>${despacho.tipoActividad}</td>
                <td>$${Math.round(despacho.costeAbono)}</td>
                <td>
                    <span class="estado-badge ${estadoClass}">
                        ${despacho.estadoAbono}
                    </span>
                </td>
                <td>${despacho.comentarios || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-warning btn-action" onclick="app.editDespacho('${despacho._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-action" onclick="app.deleteDespacho('${despacho._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        this.configurarOrdenamientoTabla('despachos-table');
    }

    // En showDespachoModal - CAMBIAR los valores
    showDespachoModal(despacho = null) {
        const modal = new bootstrap.Modal(document.getElementById('despachoModal'));
        const title = document.getElementById('despachoModalTitle');

        // Configurar evento para validar pedido manualmente
        const inputPedido = document.getElementById('id-pedido-despacho');
        inputPedido.addEventListener('input', () => this.validarPedidoManual());

        // Limpiar campos al abrir modal nuevo
        if (!despacho) {
            document.getElementById('pedido-status').textContent = 'Ingresa el ID del pedido';
            document.getElementById('pedido-status').className = 'text-muted';
            this.limpiarCamposPedido();
        }

        if (despacho) {
            title.textContent = 'Editar Despacho/Abono';
            document.getElementById('despacho-id').value = despacho._id;
            document.getElementById('id-pedido-despacho').value = despacho.idPedido;
            document.getElementById('cliente-diseno-despacho').value = despacho.clienteDiseno;
            document.getElementById('cantidad-chapas-despacho').value = despacho.cantidadChapas;
            document.getElementById('medida-despacho').value = despacho.medida;
            document.getElementById('tipo-chapa-despacho').value = despacho.tipoChapa;
            document.getElementById('tipo-actividad').value = despacho.tipoActividad;
            document.getElementById('coste-abono').value = Math.round(despacho.costeAbono);
            document.getElementById('estado-abono').value = despacho.estadoAbono;
            document.getElementById('comentarios-despacho').value = despacho.comentarios || '';

            // Marcar como válido si está editando
            document.getElementById('pedido-status').textContent = 'Pedido válido (modo edición)';
            document.getElementById('pedido-status').className = 'text-success';
        } else {
            title.textContent = 'Agregar Despacho/Abono';
            document.getElementById('despacho-form').reset();
            document.getElementById('despacho-id').value = '';
            document.getElementById('id-pedido-despacho').value = '';
            document.getElementById('tipo-actividad').value = 'Fabricando Pedido';
            document.getElementById('coste-abono').value = '4000';
            document.getElementById('estado-abono').value = 'No Pagado';
        }

        modal.show();
    }

    // Función para validar pedido manualmente
    async validarPedidoManual() {
        const idPedido = document.getElementById('id-pedido-despacho').value.trim();
        const statusElement = document.getElementById('pedido-status');

        if (!idPedido) {
            statusElement.textContent = 'Ingresa el ID del pedido';
            statusElement.className = 'text-muted';
            this.limpiarCamposPedido();
            return;
        }

        // Validar formato básico (PED seguido de números)
        if (!idPedido.match(/^PED\d+$/)) {
            statusElement.textContent = '❌ Formato inválido. Debe ser PED seguido de números (Ej: PED0001)';
            statusElement.className = 'text-danger';
            this.limpiarCamposPedido();
            return;
        }

        try {
            // Buscar el pedido en la base de datos
            const response = await fetch(`${this.apiBase}/pedidos`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const pedidos = await response.json();
                const pedidoEncontrado = pedidos.find(pedido => pedido.idPedido === idPedido);

                if (pedidoEncontrado) {
                    // Pedido encontrado - llenar campos automáticamente
                    document.getElementById('cliente-diseno-despacho').value = pedidoEncontrado.clienteDiseno;
                    document.getElementById('cantidad-chapas-despacho').value = pedidoEncontrado.cantidadChapitas;
                    document.getElementById('medida-despacho').value = pedidoEncontrado.medida;
                    document.getElementById('tipo-chapa-despacho').value = pedidoEncontrado.tipoChapa;

                    statusElement.textContent = '✅ Pedido encontrado - Campos llenados automáticamente';
                    statusElement.className = 'text-success';
                } else {
                    // Pedido no encontrado - limpiar campos pero permitir continuar
                    this.limpiarCamposPedido();
                    statusElement.textContent = '⚠️ Pedido no encontrado. Puedes continuar manualmente';
                    statusElement.className = 'text-warning';
                }
            }
        } catch (error) {
            console.error('Error validando pedido:', error);
            statusElement.textContent = '❌ Error al validar pedido';
            statusElement.className = 'text-danger';
            this.limpiarCamposPedido();
        }
    }

    // Función para limpiar campos del pedido
    limpiarCamposPedido() {
        document.getElementById('cliente-diseno-despacho').value = '';
        document.getElementById('cantidad-chapas-despacho').value = '';
        document.getElementById('medida-despacho').value = '';
        document.getElementById('tipo-chapa-despacho').value = '';
    }

    // ELIMINAR la función configurarSelectPedidos ya que no la usaremos más
    // También elimina la llamada a cargarPedidosEnDespachos() en showDespachoModal

    async saveDespacho() {
        try {
            const formData = {
                idPedido: document.getElementById('id-pedido-despacho').value,
                clienteDiseno: document.getElementById('cliente-diseno-despacho').value,
                cantidadChapas: parseInt(document.getElementById('cantidad-chapas-despacho').value),
                medida: document.getElementById('medida-despacho').value,
                tipoChapa: document.getElementById('tipo-chapa-despacho').value,
                tipoActividad: document.getElementById('tipo-actividad').value,
                costeAbono: parseInt(document.getElementById('coste-abono').value),
                estadoAbono: document.getElementById('estado-abono').value,
                comentarios: document.getElementById('comentarios-despacho').value
            };

            // Validar datos antes de enviar
            const errores = this.validarDatosDespacho(formData);
            if (errores.length > 0) {
                throw new Error(errores.join('\n'));
            }

            console.log('Datos a guardar:', formData);

            const id = document.getElementById('despacho-id').value;
            const url = id ? `${this.apiBase}/despachos/${id}` : `${this.apiBase}/despachos`;
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(formData)
            });

            const responseData = await response.json();
            console.log('Respuesta completa:', responseData);

            if (response.ok) {
                bootstrap.Modal.getInstance(document.getElementById('despachoModal')).hide();
                await this.loadDespachos();
                this.actualizarTodosLosResumenes();  // ← AGREGA ESTA LÍNEA
                this.mostrarMensajeExito('Despacho guardado exitosamente');
            } else {
                let mensajeError = 'Error guardando el despacho';

                if (responseData.message) {
                    mensajeError = responseData.message;
                } else if (responseData.error) {
                    mensajeError = responseData.error;
                } else if (responseData.errors) {
                    const erroresValidacion = Object.values(responseData.errors).map(err => err.message || err).join(', ');
                    mensajeError = `Errores de validación: ${erroresValidacion}`;
                }

                throw new Error(mensajeError);
            }
        } catch (error) {
            console.error('Error completo guardando despacho:', error);
            alert('❌ Error: ' + error.message);
        }
    }

    // Función para validar datos antes de guardar
    validarDatosDespacho(formData) {
        const errores = [];

        if (!formData.idPedido) {
            errores.push('ID de Pedido es requerido');
        }
        if (!formData.clienteDiseno) {
            errores.push('Cliente/Diseño es requerido');
        }
        if (!formData.cantidadChapas || formData.cantidadChapas <= 0) {
            errores.push('Cantidad de chapas debe ser mayor a 0');
        }
        if (!formData.medida) {
            errores.push('Medida es requerida');
        }
        if (!formData.tipoChapa) {
            errores.push('Tipo de chapa es requerido');
        }
        if (!formData.tipoActividad) {
            errores.push('Tipo de actividad es requerido');
        }
        if (!formData.costeAbono || formData.costeAbono < 0) {
            errores.push('Coste de abono debe ser mayor o igual a 0');
        }
        if (!formData.estadoAbono) {
            errores.push('Estado de abono es requerido');
        }

        return errores;
    }

    async editDespacho(id) {
        try {
            console.log('Editando despacho ID:', id);

            const response = await fetch(`${this.apiBase}/despachos/${id}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            console.log('Respuesta edición:', response.status);

            if (response.ok) {
                const despacho = await response.json();
                console.log('Despacho cargado:', despacho);
                this.showDespachoModal(despacho);
            } else {
                const errorData = await response.json();
                console.error('Error cargando despacho:', errorData);
                alert('Error cargando el despacho para editar: ' + (errorData.message || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error completo editando despacho:', error);
            alert('Error de conexión: ' + error.message);
        }
    }

    // Función temporal para debug - eliminar después
    debugDespachos() {
        fetch(`${this.apiBase}/despachos`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        })
            .then(response => response.json())
            .then(despachos => {
                console.log('=== TODOS LOS DESPACHOS ===');
                despachos.forEach((d, i) => {
                    console.log(`${i + 1}. ID: ${d._id}, Pedido: ${d.idPedido}, Actividad: ${d.tipoActividad}, Estado: ${d.estadoAbono}`);
                });
            })
            .catch(error => {
                console.error('Error en debug:', error);
            });
    }

    // Función para descubrir los valores válidos del enum
    async descubrirValoresEnum() {
        try {
            const response = await fetch(`${this.apiBase}/despachos`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const despachos = await response.json();
                const tiposUnicos = [...new Set(despachos.map(d => d.tipoActividad))];
                console.log('🎯 VALORES VÁLIDOS de tipoActividad en tu BD:', tiposUnicos);
                alert('🎯 Valores VÁLIDOS en tu BD:\n' + tiposUnicos.join('\n'));
                return tiposUnicos;
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async deleteDespacho(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este despacho?')) {
            try {
                const response = await fetch(`${this.apiBase}/despachos/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });

                if (response.ok) {
                    await this.loadDespachos();
                    this.actualizarTodosLosResumenes();  // ← AGREGA ESTA LÍNEA
                } else {
                    alert('Error eliminando el despacho');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión');
            }
        }
    }

    // ========== FUNCIONES AUXILIARES ==========
    // En crearDespachoAutomatico - CAMBIAR también
    async crearDespachoAutomatico(pedido) {
        try {
            const despachoData = {
                idPedido: pedido.idPedido,
                clienteDiseno: pedido.clienteDiseno,
                cantidadChapas: pedido.cantidadChapitas,
                medida: pedido.medida,
                tipoChapa: pedido.tipoChapa,
                tipoActividad: 'Fabricando Pedido', // Valor exacto del enum
                costeAbono: 4000,
                estadoAbono: 'No Pagado',
                comentarios: 'Despacho creado automáticamente al generar el pedido'
            };

            const response = await fetch(`${this.apiBase}/despachos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(despachoData)
            });

            if (response.ok) {
                console.log('✅ Despacho creado automáticamente');
            }
        } catch (error) {
            console.error('Error creando despacho automático:', error);
        }
    }

    async cargarPedidosEnDespachos() {
        try {
            const response = await fetch(`${this.apiBase}/pedidos`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const pedidos = await response.json();
                const select = document.getElementById('id-pedido-despacho');
                select.innerHTML = '<option value="">Seleccionar pedido</option>';

                pedidos.forEach(pedido => {
                    const option = document.createElement('option');
                    option.value = pedido.idPedido;
                    option.textContent = `${pedido.idPedido} - ${pedido.clienteDiseno}`;
                    option.dataset.pedido = JSON.stringify(pedido);
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error cargando pedidos para despachos:', error);
        }
    }

    configurarSelectPedidos() {
        const select = document.getElementById('id-pedido-despacho');
        if (select) {
            select.addEventListener('change', (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                if (selectedOption.dataset.pedido) {
                    const pedido = JSON.parse(selectedOption.dataset.pedido);
                    document.getElementById('cliente-diseno-despacho').value = pedido.clienteDiseno;
                    document.getElementById('cantidad-chapas-despacho').value = pedido.cantidadChapitas;
                    document.getElementById('medida-despacho').value = pedido.medida;
                    document.getElementById('tipo-chapa-despacho').value = pedido.tipoChapa;
                }
            });
        }
    }

    // ========== SISTEMA DE ORDENAMIENTO PARA TODAS LAS TABLAS ==========
    configurarOrdenamientoTabla(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const headers = table.querySelectorAll('thead th');
        let currentSort = { column: -1, direction: 1 };

        headers.forEach((header, index) => {
            header.style.cursor = 'pointer';
            header.classList.add('sortable-header');

            header.addEventListener('click', () => {
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));

                // Determinar dirección
                if (currentSort.column === index) {
                    currentSort.direction = -currentSort.direction;
                } else {
                    currentSort.column = index;
                    currentSort.direction = 1;
                }

                // Remover clases anteriores
                headers.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));

                // Agregar clase actual
                header.classList.add(currentSort.direction === 1 ? 'sort-asc' : 'sort-desc');

                // Ordenar filas
                rows.sort((a, b) => {
                    const aValue = a.cells[index].textContent.trim();
                    const bValue = b.cells[index].textContent.trim();

                    // Para columnas numéricas
                    if (index === 2 || aValue.match(/^\$?\d+/)) {
                        const numA = parseFloat(aValue.replace('$', '')) || 0;
                        const numB = parseFloat(bValue.replace('$', '')) || 0;
                        return (numA - numB) * currentSort.direction;
                    }

                    // Para medidas (25mm, 37mm, etc.)
                    if (aValue.includes('mm')) {
                        const numA = parseInt(aValue.replace('mm', '')) || 0;
                        const numB = parseInt(bValue.replace('mm', '')) || 0;
                        return (numA - numB) * currentSort.direction;
                    }

                    // Para texto
                    return aValue.localeCompare(bValue) * currentSort.direction;
                });

                // Reinsertar filas ordenadas
                rows.forEach(row => tbody.appendChild(row));
            });
        });
    }

    // ========== RESUMENES ==========

    // Función para calcular y actualizar el resumen de fabricación
    // ========== FUNCIONES CORREGIDAS PARA RESUMEN DE FABRICACIÓN ==========

    // Función para calcular y actualizar el resumen de fabricación
    actualizarResumenFabricacion() {
        fetch(`${this.apiBase}/despachos`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        })
            .then(response => response.json())
            .then(despachos => {
                let totalPedidos = 0;
                let valorTotal = 0;
                const precioUnitario = 27; // $27 por pedido (no por chapa)

                // Usar un Set para contar pedidos únicos
                const pedidosUnicos = new Set();

                despachos.forEach(despacho => {
                    const tipoActividad = despacho.tipoActividad;
                    const estadoAbono = despacho.estadoAbono;
                    const idPedido = despacho.idPedido;

                    // Solo contar "Fabricando Pedido" que estén "No Pagado"
                    if (tipoActividad === 'Fabricando Pedido' && estadoAbono === 'No Pagado') {
                        // Contar pedidos únicos (no duplicados por el mismo ID de pedido)
                        if (!pedidosUnicos.has(idPedido)) {
                            pedidosUnicos.add(idPedido);
                            totalPedidos += 1;
                            valorTotal += precioUnitario; // $27 por pedido, no por cantidad de chapas
                        }
                    }
                });

                // Actualizar la interfaz
                const totalFabricacionElement = document.getElementById('total-fabricacion-pendientes');
                const valorTotalElement = document.getElementById('valor-total-fabricacion');

                if (totalFabricacionElement) {
                    totalFabricacionElement.textContent = totalPedidos;
                }

                if (valorTotalElement) {
                    valorTotalElement.textContent = `$${valorTotal.toLocaleString()}`;
                }
            })
            .catch(error => {
                console.error('Error calculando resumen de fabricación:', error);
            });
    }

    // Función para calcular resumen de abonos pendientes (versión mejorada)
    // ========== FUNCIONES CORREGIDAS PARA RESUMEN DE FABRICACIÓN ==========

    // Función para calcular y actualizar el resumen de fabricación
    actualizarResumenFabricacion() {
        fetch(`${this.apiBase}/despachos`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        })
            .then(response => response.json())
            .then(despachos => {
                let totalPedidos = 0;
                let totalChapas = 0;
                let valorTotal = 0;
                const precioPorChapa = 27; // $27 por CHAPA

                // Usar un Set para contar pedidos únicos
                const pedidosUnicos = new Set();

                despachos.forEach(despacho => {
                    const tipoActividad = despacho.tipoActividad;
                    const estadoAbono = despacho.estadoAbono;
                    const idPedido = despacho.idPedido;
                    const cantidadChapas = despacho.cantidadChapas || 0;

                    // Solo contar "Fabricando Pedido" que estén "No Pagado"
                    if (tipoActividad === 'Fabricando Pedido' && estadoAbono === 'No Pagado') {
                        // Contar pedidos únicos (no duplicados por el mismo ID de pedido)
                        if (!pedidosUnicos.has(idPedido)) {
                            pedidosUnicos.add(idPedido);
                            totalPedidos += 1;
                        }

                        // Sumar cantidad de chapas para el cálculo del valor
                        totalChapas += cantidadChapas;
                        valorTotal += cantidadChapas * precioPorChapa; // $27 por CHAPA
                    }
                });

                // Actualizar la interfaz
                const totalFabricacionElement = document.getElementById('total-fabricacion-pendientes');
                const valorTotalElement = document.getElementById('valor-total-fabricacion');

                if (totalFabricacionElement) {
                    totalFabricacionElement.textContent = totalPedidos;
                }

                if (valorTotalElement) {
                    valorTotalElement.textContent = `$${valorTotal.toLocaleString()}`;
                }

                console.log(`Resumen Fabricación: ${totalPedidos} pedidos, ${totalChapas} chapas, $${valorTotal}`);
            })
            .catch(error => {
                console.error('Error calculando resumen de fabricación:', error);
            });
    }

    // Función para calcular resumen de abonos pendientes (versión mejorada)
    actualizarResumenAbonosPendientes() {
        fetch(`${this.apiBase}/despachos`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        })
            .then(response => response.json())
            .then(despachos => {
                let totalAbonos = 0;
                let valorTotalPendiente = 0;

                // Usar un Set para contar abonos únicos por ID de pedido
                const abonosUnicos = new Set();

                despachos.forEach(despacho => {
                    const estadoAbono = despacho.estadoAbono;
                    const tipoActividad = despacho.tipoActividad;
                    const costeAbono = despacho.costeAbono || 0;
                    const idPedido = despacho.idPedido;

                    // Solo contar abonos no pagados que NO sean "Fabricando Pedido"
                    if (estadoAbono === 'No Pagado' && tipoActividad !== 'Fabricando Pedido') {
                        // Contar abonos únicos (no duplicados por el mismo ID de pedido)
                        if (!abonosUnicos.has(idPedido)) {
                            abonosUnicos.add(idPedido);
                            totalAbonos += 1;
                            valorTotalPendiente += costeAbono;
                        }
                    }
                });

                // Actualizar la interfaz
                const totalAbonosElement = document.getElementById('total-abonos-pendientes');
                const valorTotalPendienteElement = document.getElementById('valor-total-pendiente');

                if (totalAbonosElement) {
                    totalAbonosElement.textContent = totalAbonos;
                }

                if (valorTotalPendienteElement) {
                    valorTotalPendienteElement.textContent = `$${Math.round(valorTotalPendiente).toLocaleString()}`;
                }
            })
            .catch(error => {
                console.error('Error calculando abonos pendientes:', error);
            });
    }

    // Función para actualizar ambos resúmenes
    actualizarTodosLosResumenes() {
        this.actualizarResumenFabricacion();
        this.actualizarResumenAbonosPendientes();
    }
    actualizarTablaFabricacion() {
        const tbody = document.getElementById('despachos-body');
        const filas = tbody.getElementsByTagName('tr');
        let totalFabricacion = 0;
        let cantidadFabricacion = 0;

        for (let fila of filas) {
            const celdas = fila.getElementsByTagName('td');

            if (celdas.length >= 8) {
                const tipoActividad = celdas[5].textContent.trim();
                const estadoAbono = celdas[7].textContent.trim();

                // SOLO sumar "Fabricando Pedido" que estén NO PAGADOS
                if (tipoActividad === 'Fabricando Pedido' && estadoAbono === 'No Pagado') {
                    cantidadFabricacion++;

                    const costeAbono = celdas[6].textContent.trim();
                    const valorNumerico = parseFloat(costeAbono.replace('$', '').replace(',', '').trim());

                    if (!isNaN(valorNumerico)) {
                        totalFabricacion += valorNumerico;
                    }
                }
            }
        }

        document.getElementById('total-fabricacion-pendientes').textContent = cantidadFabricacion;
        document.getElementById('valor-total-fabricacion').textContent = `$${Math.round(totalFabricacion)}`;
    }


    mostrarMensajeExito(mensaje) {
        const toast = document.createElement('div');
        toast.className = 'toast align-items-center text-white bg-success border-0';
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-check-circle me-2"></i>${mensaje}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        const container = document.getElementById('toast-container') || this.crearToastContainer();
        container.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    crearToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }

    // Función temporal para ver los valores del enum
    async verValoresEnum() {
        try {
            const response = await fetch(`${this.apiBase}/despachos`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const despachos = await response.json();
                const tiposUnicos = [...new Set(despachos.map(d => d.tipoActividad))];
                console.log('Valores de tipoActividad en la BD:', tiposUnicos);
                alert('Valores en BD: ' + tiposUnicos.join(', '));
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Mostrar modal de historial (SOLO FECHA pero CON COMENTARIOS)
    mostrarModalHistorial(historial) {
        const modal = new bootstrap.Modal(document.getElementById('historialInventarioModal'));

        const tbody = document.getElementById('historial-body');
        tbody.innerHTML = '';

        if (historial.length === 0) {
            tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    No hay registros en el historial
                </td>
            </tr>
        `;
        } else {
            historial.forEach(movimiento => {
                const fecha = new Date(movimiento.createdAt).toLocaleDateString('es-ES');

                const tr = document.createElement('tr');
                tr.innerHTML = `
                <td>${fecha}</td>
                <td>${movimiento.tipoMovimiento}</td>
                <td class="text-end">${movimiento.cantidadAnterior}</td>
                <td class="text-end text-success">+${movimiento.cantidadRepuesta}</td>
                <td class="text-end">${movimiento.cantidadNueva}</td>
                <td>${movimiento.usuario}</td>
                <td>${movimiento.comentario || '-'}</td>
            `;
                tbody.appendChild(tr);
            });
        }

        modal.show();
    }
}

const app = new SistemaChapitas();
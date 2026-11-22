/**
 * 모달 컴포넌트
 * 재사용 가능한 모달 기능 제공
 * 기존 adminUtils.showModal과 modal.css 두 시스템을 모두 지원
 */

(function() {
    'use strict';

    window.Modal = {
        /**
         * 현재 열려있는 모달 스택
         * @private
         */
        _modalStack: [],

        /**
         * 기본 옵션
         * @private
         */
        _defaultOptions: {
            title: '알림',
            content: '',
            closeButton: true,
            backdrop: true,
            keyboard: true,
            buttons: [],
            size: 'default', // 'sm', 'default', 'lg', 'xl'
            centered: false,
            fade: true,
            type: 'bootstrap', // 'bootstrap' or 'admin'
            onOpen: null,
            onClose: null
        },

        /**
         * 모달 표시 (부트스트랩 스타일)
         * @param {Object} options - 모달 옵션
         * @returns {HTMLElement} - 생성된 모달 요소
         */
        show: function(options) {
            const config = Object.assign({}, this._defaultOptions, options);
            
            if (config.type === 'admin') {
                // 관리자 스타일 모달 사용
                return this._showAdminModal(config);
            }
            
            // 부트스트랩 스타일 모달 사용
            return this._showBootstrapModal(config);
        },

        /**
         * 부트스트랩 스타일 모달 표시
         * @private
         */
        _showBootstrapModal: function(config) {
            // 모달 백드롭 생성
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade';
            document.body.appendChild(backdrop);
            
            // 모달 생성
            const modal = this._createBootstrapModal(config);
            document.body.appendChild(modal);
            document.body.classList.add('modal-open');
            
            // 모달 스택에 추가
            this._modalStack.push({
                element: modal,
                backdrop: backdrop,
                config: config
            });
            
            // 애니메이션 처리
            setTimeout(() => {
                backdrop.classList.add('show');
                modal.classList.add('show');
                if (config.fade) {
                    modal.classList.add('fade');
                }
            }, 10);
            
            // onOpen 콜백 실행
            if (typeof config.onOpen === 'function') {
                config.onOpen(modal);
            }
            
            return modal;
        },

        /**
         * 관리자 스타일 모달 표시 (기존 adminUtils 호환)
         * @private
         */
        _showAdminModal: function(config) {
            // 기존 adminUtils.showModal과 동일한 방식
            adminUtils.showModal({
                title: config.title,
                content: config.content,
                buttons: config.buttons
            });
            
            const modal = document.getElementById('admin-modal');
            if (modal) {
                this._modalStack.push({
                    element: modal,
                    config: config,
                    type: 'admin'
                });
                
                if (typeof config.onOpen === 'function') {
                    config.onOpen(modal);
                }
            }
            
            return modal;
        },

        /**
         * 부트스트랩 모달 요소 생성
         * @private
         */
        _createBootstrapModal: function(config) {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.setAttribute('tabindex', '-1');
            modal.setAttribute('role', 'dialog');
            
            // 사이즈 클래스 매핑
            const sizeClass = config.size !== 'default' ? `modal-${config.size}` : '';
            const centeredClass = config.centered ? 'modal-dialog-centered' : '';
            
            modal.innerHTML = `
                <div class="modal-dialog ${sizeClass} ${centeredClass}" role="document">
                    <div class="modal-content">
                        ${config.title || config.closeButton ? `
                            <div class="modal-header">
                                ${config.title ? `<h5 class="modal-title">${config.title}</h5>` : ''}
                                ${config.closeButton ? `
                                    <button type="button" class="close" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                ` : ''}
                            </div>
                        ` : ''}
                        ${config.content ? `
                            <div class="modal-body">
                                ${config.content}
                            </div>
                        ` : ''}
                        ${config.buttons && config.buttons.length > 0 ? `
                            <div class="modal-footer">
                                ${config.buttons.map((btn, index) => `
                                    <button type="button" 
                                        class="btn btn-${btn.type || 'secondary'}"
                                        data-button-index="${index}">
                                        ${btn.label}
                                    </button>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            // 이벤트 리스너 설정
            this._setupBootstrapEventListeners(modal, config);
            
            return modal;
        },

        /**
         * 부트스트랩 모달 이벤트 리스너 설정
         * @private
         */
        _setupBootstrapEventListeners: function(modal, config) {
            // 닫기 버튼 이벤트
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.close(modal);
                });
            }
            
            // 버튼 이벤트
            config.buttons.forEach((btn, index) => {
                const buttonElement = modal.querySelector(`[data-button-index="${index}"]`);
                if (buttonElement && btn.handler) {
                    buttonElement.addEventListener('click', (e) => {
                        if (typeof btn.handler === 'function') {
                            btn.handler(e, modal);
                        } else if (typeof btn.handler === 'string') {
                            // eval 대신 Function 생성자 사용
                            try {
                                new Function('modal', btn.handler)(modal);
                            } catch (error) {
                                console.error('Button handler error:', error);
                            }
                        }
                    });
                }
            });
            
            // 배경 클릭 이벤트
            if (config.backdrop) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.close(modal);
                    }
                });
            }
            
            // ESC 키 이벤트
            if (config.keyboard) {
                const escHandler = (e) => {
                    if (e.key === 'Escape' && this._modalStack[this._modalStack.length - 1]?.element === modal) {
                        this.close(modal);
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                document.addEventListener('keydown', escHandler);
            }
        },

        /**
         * 모달 닫기
         * @param {HTMLElement} modal - 닫을 모달 요소
         */
        close: function(modal) {
            if (!modal && this._modalStack.length > 0) {
                modal = this._modalStack[this._modalStack.length - 1].element;
            }
            
            if (!modal) return;
            
            // 스택에서 모달 정보 찾기
            const modalInfo = this._modalStack.find(m => m.element === modal);
            if (!modalInfo) return;
            
            // onClose 콜백 실행
            if (typeof modalInfo.config.onClose === 'function') {
                modalInfo.config.onClose(modal);
            }
            
            if (modalInfo.type === 'admin') {
                // 관리자 모달 닫기
                adminUtils.closeModal();
            } else {
                // 부트스트랩 모달 닫기
                modal.classList.add('fade-out');
                
                // 애니메이션 완료 후 제거
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                    
                    // 백드롭 제거
                    if (modalInfo.backdrop && modalInfo.backdrop.parentNode) {
                        modalInfo.backdrop.parentNode.removeChild(modalInfo.backdrop);
                    }
                    
                    // 스택에서 제거
                    const index = this._modalStack.findIndex(m => m.element === modal);
                    if (index > -1) {
                        this._modalStack.splice(index, 1);
                    }
                    
                    // 모든 모달이 닫혔으면 body 클래스 제거
                    if (this._modalStack.length === 0) {
                        document.body.classList.remove('modal-open');
                    }
                }, 200);
            }
        },

        /**
         * 모든 모달 닫기
         */
        closeAll: function() {
            while (this._modalStack.length > 0) {
                this.close();
            }
        },

        /**
         * 유틸리티 메서드들
         */
        
        alert: function(message, title = '알림', options = {}) {
            return this.show(Object.assign({
                title: title,
                content: `<p>${message}</p>`,
                buttons: [
                    {
                        label: '확인',
                        type: 'primary',
                        handler: (e, modal) => {
                            this.close(modal);
                            if (options.onConfirm) options.onConfirm();
                        }
                    }
                ]
            }, options));
        },

        confirm: function(message, title = '확인', onConfirm = null, onCancel = null, options = {}) {
            return this.show(Object.assign({
                title: title,
                content: `<p>${message}</p>`,
                buttons: [
                    {
                        label: '취소',
                        type: 'secondary',
                        handler: (e, modal) => {
                            this.close(modal);
                            if (onCancel) onCancel();
                        }
                    },
                    {
                        label: '확인',
                        type: 'primary',
                        handler: (e, modal) => {
                            this.close(modal);
                            if (onConfirm) onConfirm();
                        }
                    }
                ]
            }, options));
        },

        prompt: function(message, title = '입력', defaultValue = '', onSubmit = null, onCancel = null, options = {}) {
            const inputId = 'prompt-input-' + Date.now();
            
            return this.show(Object.assign({
                title: title,
                content: `
                    <p>${message}</p>
                    <input type="text" id="${inputId}" class="form-control" value="${defaultValue}">
                `,
                buttons: [
                    {
                        label: '취소',
                        type: 'secondary',
                        handler: (e, modal) => {
                            this.close(modal);
                            if (onCancel) onCancel();
                        }
                    },
                    {
                        label: '확인',
                        type: 'primary',
                        handler: (e, modal) => {
                            const input = modal.querySelector(`#${inputId}`);
                            const value = input ? input.value : '';
                            this.close(modal);
                            if (onSubmit) onSubmit(value);
                        }
                    }
                ],
                onOpen: (modal) => {
                    const input = modal.querySelector(`#${inputId}`);
                    if (input) {
                        input.focus();
                        input.select();
                    }
                }
            }, options));
        },

        /**
         * 이미지 모달
         */
        image: function(src, title = null, options = {}) {
            return this.show(Object.assign({
                title: title,
                content: `<img src="${src}" alt="${title || ''}" class="img-fluid">`,
                size: 'lg',
                buttons: []
            }, options));
        }
    };

    // 전역 window 객체에 모달 유틸리티 추가
    window.showModal = Modal.show.bind(Modal);
    window.closeModal = Modal.close.bind(Modal);
})();
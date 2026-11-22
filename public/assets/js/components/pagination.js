/**
 * 페이지네이션 컴포넌트
 * 목록의 페이지 나누기 기능을 제공
 */

(function() {
    'use strict';

    window.Pagination = {
        /**
         * 기본 옵션
         * @private
         */
        _defaultOptions: {
            totalItems: 0,
            itemsPerPage: 10,
            currentPage: 1,
            maxButtons: 5,
            showFirstLast: true,
            showPrevNext: true,
            showPageInfo: false,
            showItemsPerPage: false,
            itemsPerPageOptions: [10, 20, 50, 100],
            labels: {
                first: '처음',
                last: '마지막',
                previous: '이전',
                next: '다음',
                page: '페이지',
                of: '/',
                items: '개',
                itemsPerPage: '페이지당 표시',
                showing: '표시 중',
                to: '~',
                total: '전체'
            },
            onPageChange: null,
            onItemsPerPageChange: null
        },

        /**
         * 페이지네이션 생성
         * @param {string|HTMLElement} container - 컨테이너 요소 또는 선택자
         * @param {Object} options - 옵션
         * @returns {Object} - 페이지네이션 인스턴스
         */
        create: function(container, options = {}) {
            const config = Object.assign({}, this._defaultOptions, options);
            const containerElement = typeof container === 'string' ? 
                document.querySelector(container) : container;
            
            if (!containerElement) {
                console.error('Pagination container not found');
                return null;
            }

            // 페이지네이션 인스턴스 생성
            const instance = {
                container: containerElement,
                config: config,
                totalPages: Math.ceil(config.totalItems / config.itemsPerPage),
                
                // 메서드들
                render: () => this._render(instance),
                goToPage: (page) => this._goToPage(instance, page),
                setTotalItems: (total) => this._setTotalItems(instance, total),
                setItemsPerPage: (itemsPerPage) => this._setItemsPerPage(instance, itemsPerPage),
                destroy: () => this._destroy(instance)
            };

            // 초기 렌더링
            instance.render();

            return instance;
        },

        /**
         * 페이지네이션 렌더링
         * @private
         */
        _render: function(instance) {
            const { container, config, totalPages } = instance;
            
            if (totalPages === 0) {
                container.innerHTML = '';
                return;
            }

            let html = '<div class="pagination-wrapper">';

            // 페이지당 항목 수 선택기
            if (config.showItemsPerPage) {
                html += this._renderItemsPerPage(instance);
            }

            // 페이지 정보
            if (config.showPageInfo) {
                html += this._renderPageInfo(instance);
            }

            // 페이지네이션 버튼
            html += '<div class="pagination">';
            
            // 첫 페이지 버튼
            if (config.showFirstLast) {
                html += this._renderButton('first', '&laquo;', config.currentPage === 1, config.labels.first);
            }

            // 이전 페이지 버튼
            if (config.showPrevNext) {
                html += this._renderButton('prev', '&lsaquo;', config.currentPage === 1, config.labels.previous);
            }

            // 페이지 번호 버튼들
            const buttons = this._calculatePageButtons(instance);
            buttons.forEach(page => {
                if (page === '...') {
                    html += '<span class="pagination-ellipsis">...</span>';
                } else {
                    html += this._renderButton(
                        'page', 
                        page, 
                        false, 
                        `${config.labels.page} ${page}`,
                        page === config.currentPage
                    );
                }
            });

            // 다음 페이지 버튼
            if (config.showPrevNext) {
                html += this._renderButton(
                    'next', 
                    '&rsaquo;', 
                    config.currentPage === totalPages, 
                    config.labels.next
                );
            }

            // 마지막 페이지 버튼
            if (config.showFirstLast) {
                html += this._renderButton(
                    'last', 
                    '&raquo;', 
                    config.currentPage === totalPages, 
                    config.labels.last
                );
            }

            html += '</div></div>';

            container.innerHTML = html;

            // 이벤트 리스너 설정
            this._setupEventListeners(instance);
        },

        /**
         * 페이지 번호 계산
         * @private
         */
        _calculatePageButtons: function(instance) {
            const { config, totalPages } = instance;
            const current = config.currentPage;
            const max = config.maxButtons;
            const buttons = [];

            if (totalPages <= max) {
                // 전체 페이지가 최대 버튼 수보다 적으면 모두 표시
                for (let i = 1; i <= totalPages; i++) {
                    buttons.push(i);
                }
            } else {
                // 현재 페이지를 중심으로 버튼 표시
                let start = Math.max(1, current - Math.floor(max / 2));
                let end = Math.min(totalPages, start + max - 1);

                // 시작 페이지 조정
                if (end - start < max - 1) {
                    start = Math.max(1, end - max + 1);
                }

                // 첫 페이지
                if (start > 1) {
                    buttons.push(1);
                    if (start > 2) buttons.push('...');
                }

                // 페이지 번호들
                for (let i = start; i <= end; i++) {
                    buttons.push(i);
                }

                // 마지막 페이지
                if (end < totalPages) {
                    if (end < totalPages - 1) buttons.push('...');
                    buttons.push(totalPages);
                }
            }

            return buttons;
        },

        /**
         * 버튼 렌더링
         * @private
         */
        _renderButton: function(type, label, disabled, ariaLabel, active = false) {
            const classes = ['pagination-btn', `pagination-btn-${type}`];
            if (disabled) classes.push('disabled');
            if (active) classes.push('active');

            const attributes = [
                `class="${classes.join(' ')}"`,
                `data-type="${type}"`,
                `data-page="${type === 'page' ? label : ''}"`,
                `aria-label="${ariaLabel}"`,
                disabled ? 'disabled' : '',
                active ? 'aria-current="page"' : ''
            ].filter(Boolean).join(' ');

            return `<button ${attributes}>${label}</button>`;
        },

        /**
         * 페이지 정보 렌더링
         * @private
         */
        _renderPageInfo: function(instance) {
            const { config } = instance;
            const start = (config.currentPage - 1) * config.itemsPerPage + 1;
            const end = Math.min(config.currentPage * config.itemsPerPage, config.totalItems);
            
            return `
                <div class="pagination-info">
                    ${config.labels.showing} ${start} ${config.labels.to} ${end} 
                    ${config.labels.of} ${config.totalItems} ${config.labels.items}
                </div>
            `;
        },

        /**
         * 페이지당 항목 수 선택기 렌더링
         * @private
         */
        _renderItemsPerPage: function(instance) {
            const { config } = instance;
            
            return `
                <div class="pagination-per-page">
                    <label>
                        ${config.labels.itemsPerPage}:
                        <select class="pagination-per-page-select">
                            ${config.itemsPerPageOptions.map(option => `
                                <option value="${option}" ${option === config.itemsPerPage ? 'selected' : ''}>
                                    ${option}
                                </option>
                            `).join('')}
                        </select>
                    </label>
                </div>
            `;
        },

        /**
         * 이벤트 리스너 설정
         * @private
         */
        _setupEventListeners: function(instance) {
            const { container } = instance;

            // 페이지 버튼 클릭 이벤트
            container.addEventListener('click', (e) => {
                const button = e.target.closest('.pagination-btn');
                if (!button || button.disabled) return;

                const type = button.dataset.type;
                const page = parseInt(button.dataset.page);

                switch (type) {
                    case 'first':
                        this._goToPage(instance, 1);
                        break;
                    case 'last':
                        this._goToPage(instance, instance.totalPages);
                        break;
                    case 'prev':
                        this._goToPage(instance, instance.config.currentPage - 1);
                        break;
                    case 'next':
                        this._goToPage(instance, instance.config.currentPage + 1);
                        break;
                    case 'page':
                        this._goToPage(instance, page);
                        break;
                }
            });

            // 페이지당 항목 수 변경 이벤트
            const perPageSelect = container.querySelector('.pagination-per-page-select');
            if (perPageSelect) {
                perPageSelect.addEventListener('change', (e) => {
                    this._setItemsPerPage(instance, parseInt(e.target.value));
                });
            }
        },

        /**
         * 페이지 이동
         * @private
         */
        _goToPage: function(instance, page) {
            const { config, totalPages } = instance;
            
            // 유효성 검사
            if (page < 1 || page > totalPages || page === config.currentPage) {
                return;
            }

            config.currentPage = page;
            instance.render();

            // 콜백 실행
            if (typeof config.onPageChange === 'function') {
                config.onPageChange(page, instance);
            }
        },

        /**
         * 전체 항목 수 설정
         * @private
         */
        _setTotalItems: function(instance, total) {
            instance.config.totalItems = total;
            instance.totalPages = Math.ceil(total / instance.config.itemsPerPage);
            
            // 현재 페이지가 전체 페이지 수보다 크면 조정
            if (instance.config.currentPage > instance.totalPages) {
                instance.config.currentPage = Math.max(1, instance.totalPages);
            }
            
            instance.render();
        },

        /**
         * 페이지당 항목 수 설정
         * @private
         */
        _setItemsPerPage: function(instance, itemsPerPage) {
            const { config } = instance;
            
            if (itemsPerPage === config.itemsPerPage) return;
            
            // 현재 항목의 인덱스 계산
            const currentItemIndex = (config.currentPage - 1) * config.itemsPerPage;
            
            // 새로운 설정 적용
            config.itemsPerPage = itemsPerPage;
            instance.totalPages = Math.ceil(config.totalItems / itemsPerPage);
            
            // 새로운 현재 페이지 계산
            config.currentPage = Math.floor(currentItemIndex / itemsPerPage) + 1;
            config.currentPage = Math.max(1, Math.min(config.currentPage, instance.totalPages));
            
            instance.render();

            // 콜백 실행
            if (typeof config.onItemsPerPageChange === 'function') {
                config.onItemsPerPageChange(itemsPerPage, instance);
            }
        },

        /**
         * 페이지네이션 제거
         * @private
         */
        _destroy: function(instance) {
            instance.container.innerHTML = '';
        },

        /**
         * 유틸리티 메서드: 간단한 페이지네이션 생성
         */
        simple: function(container, currentPage, totalPages, onPageChange) {
            return this.create(container, {
                totalItems: totalPages * 10, // 임시값
                itemsPerPage: 10,
                currentPage: currentPage,
                totalPages: totalPages,
                showPageInfo: false,
                showItemsPerPage: false,
                onPageChange: onPageChange
            });
        },

        /**
         * 유틸리티 메서드: AJAX 페이지네이션
         */
        ajax: function(container, options) {
            const ajaxOptions = Object.assign({
                url: '',
                params: {},
                onSuccess: null,
                onError: null,
                dataKey: 'data',
                totalKey: 'total',
                pageKey: 'page',
                perPageKey: 'perPage'
            }, options);

            const loadPage = async (page, perPage) => {
                try {
                    // 로딩 표시
                    const loadingElement = document.createElement('div');
                    loadingElement.className = 'pagination-loading';
                    loadingElement.textContent = 'Loading...';
                    container.appendChild(loadingElement);

                    // AJAX 요청
                    const params = Object.assign({}, ajaxOptions.params, {
                        [ajaxOptions.pageKey]: page,
                        [ajaxOptions.perPageKey]: perPage
                    });

                    const queryString = new URLSearchParams(params).toString();
                    const response = await fetch(`${ajaxOptions.url}?${queryString}`);
                    const data = await response.json();

                    // 로딩 제거
                    loadingElement.remove();

                    // 성공 콜백
                    if (ajaxOptions.onSuccess) {
                        ajaxOptions.onSuccess(data[ajaxOptions.dataKey], data);
                    }

                    return {
                        items: data[ajaxOptions.dataKey],
                        total: data[ajaxOptions.totalKey]
                    };
                } catch (error) {
                    console.error('Pagination AJAX error:', error);
                    if (ajaxOptions.onError) {
                        ajaxOptions.onError(error);
                    }
                    return null;
                }
            };

            // 페이지네이션 인스턴스 생성
            const paginationOptions = Object.assign({}, options, {
                onPageChange: async (page, instance) => {
                    const result = await loadPage(page, instance.config.itemsPerPage);
                    if (result) {
                        instance.setTotalItems(result.total);
                    }
                },
                onItemsPerPageChange: async (perPage, instance) => {
                    const result = await loadPage(instance.config.currentPage, perPage);
                    if (result) {
                        instance.setTotalItems(result.total);
                    }
                }
            });

            const instance = this.create(container, paginationOptions);

            // 초기 데이터 로드
            loadPage(instance.config.currentPage, instance.config.itemsPerPage)
                .then(result => {
                    if (result) {
                        instance.setTotalItems(result.total);
                    }
                });

            return instance;
        }
    };

    // 기존 adminUtils와의 호환성
    if (window.adminUtils) {
        const originalCreatePagination = window.adminUtils.createPagination;
        
        window.adminUtils.createPagination = function(containerId, currentPage, totalPages, onPageChange) {
            const container = document.getElementById(containerId);
            if (!container) return;

            // 기존 호출을 새로운 Pagination 컴포넌트로 변환
            Pagination.simple(container, currentPage, totalPages, (page) => {
                // onPageChange가 문자열인 경우 (함수 이름) 실행
                if (typeof onPageChange === 'string') {
                    const func = new Function('page', `${onPageChange}(${page})`);
                    func(page);
                } else if (typeof onPageChange === 'function') {
                    onPageChange(page);
                }
            });
        };
    }
})();